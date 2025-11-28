from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
import subprocess
import os
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
import logging
import glob
import shutil

from app.core.permissions import require_permission
from app.core.config import settings
from app.db.database import engine
from sqlalchemy import text

logger = logging.getLogger("siae.maintenance")

router = APIRouter(
    prefix="/maintenance",
    tags=["Maintenance"],
    dependencies=[Depends(require_permission("canManageMaintenance"))]
)

class BackupInfo(BaseModel):
    filename: str
    size: int
    created: str

class DatabaseStats(BaseModel):
    table_name: str
    row_count: int
    total_size: str
    
class SystemStats(BaseModel):
    total_students: int
    total_users: int
    total_attendances: int
    total_absences: int
    database_size: str
    backup_count: int
    
class CleanupResult(BaseModel):
    deleted_files: int
    freed_space: int
    message: str

@router.post("/backup", response_model=BackupInfo)
async def create_backup():
    """
    Creates a database backup using pg_dump.
    """
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"backup_{timestamp}.dump"
        # Ensure backups directory exists
        backup_dir = "backups"
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)
        
        filepath = os.path.join(backup_dir, filename)
        
        logger.info(f"Creating backup: {filepath}")
        
        # PGPASSWORD environment variable is used by pg_dump to avoid password prompt
        env = os.environ.copy()
        env["PGPASSWORD"] = settings.POSTGRES_PASSWORD
        
        # pg_dump command
        # We use -F c for custom format (compressed, suitable for pg_restore)
        command = [
            "pg_dump",
            "-h", settings.POSTGRES_HOST,
            "-p", str(settings.POSTGRES_PORT),
            "-U", settings.POSTGRES_USER,
            "-F", "c", 
            "-b", 
            "-v", 
            "-f", filepath,
            settings.POSTGRES_DB
        ]
        
        logger.info(f"Running command: {' '.join(command[:-1])} {settings.POSTGRES_DB}")
        
        process = subprocess.run(
            command,
            env=env,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        logger.info(f"Backup created successfully: {filepath}")
        
        size = os.path.getsize(filepath)
        created = datetime.fromtimestamp(os.path.getctime(filepath)).isoformat()
        
        return {
            "filename": filename,
            "size": size,
            "created": created
        }
        
    except subprocess.CalledProcessError as e:
        error_msg = f"Backup failed: {e.stderr.decode()}"
        logger.error(error_msg)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
    except FileNotFoundError as e:
        error_msg = f"pg_dump not found. Please ensure PostgreSQL bin directory is in your PATH. Error: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
    except Exception as e:
        error_msg = f"An error occurred: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )

@router.get("/backups", response_model=List[BackupInfo])
async def list_backups():
    """
    List all available backups.
    """
    backup_dir = "backups"
    if not os.path.exists(backup_dir):
        return []
        
    files = []
    for f in os.listdir(backup_dir):
        if f.endswith(".dump") or f.endswith(".sql"):
             path = os.path.join(backup_dir, f)
             size = os.path.getsize(path)
             created = os.path.getctime(path)
             files.append({
                 "filename": f,
                 "size": size,
                 "created": datetime.fromtimestamp(created).isoformat()
             })
             
    # Sort by created desc
    files.sort(key=lambda x: x["created"], reverse=True)
    return files

@router.get("/download/{filename}")
async def download_backup(filename: str):
    """
    Download a specific backup file.
    """
    backup_dir = "backups"
    # Basic security check to prevent directory traversal
    if ".." in filename or "/" in filename or "\\" in filename:
         raise HTTPException(status_code=400, detail="Invalid filename")
         
    filepath = os.path.join(backup_dir, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Backup not found")
        
    return FileResponse(
        path=filepath, 
        filename=filename, 
        media_type='application/octet-stream'
    )

@router.delete("/backups/{filename}")
async def delete_backup(filename: str):
    """
    Delete a specific backup file.
    """
    backup_dir = "backups"
    # Security check
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    filepath = os.path.join(backup_dir, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Backup not found")
    
    try:
        os.remove(filepath)
        logger.info(f"Backup deleted: {filename}")
        return {"message": f"Backup {filename} deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting backup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting backup: {str(e)}"
        )

@router.post("/restore/{filename}")
async def restore_backup(filename: str):
    """
    Restore database from a backup file.
    """
    backup_dir = "backups"
    # Security check
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    filepath = os.path.join(backup_dir, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Backup not found")
    
    try:
        logger.info(f"Starting restore from: {filename}")
        
        env = os.environ.copy()
        env["PGPASSWORD"] = settings.POSTGRES_PASSWORD
        
        # Drop existing connections and restore
        command = [
            "pg_restore",
            "-h", settings.POSTGRES_HOST,
            "-p", str(settings.POSTGRES_PORT),
            "-U", settings.POSTGRES_USER,
            "-d", settings.POSTGRES_DB,
            "-c",  # Clean (drop) database objects before recreating
            "-v",
            filepath
        ]
        
        logger.info(f"Running restore command for {filename}")
        
        process = subprocess.run(
            command,
            env=env,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        logger.info(f"Backup restored successfully: {filename}")
        return {"message": f"Database restored from {filename} successfully"}
        
    except subprocess.CalledProcessError as e:
        error_msg = f"Restore failed: {e.stderr.decode()}"
        logger.error(error_msg)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
    except Exception as e:
        error_msg = f"An error occurred during restore: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )

@router.post("/cleanup-logs", response_model=CleanupResult)
async def cleanup_old_logs(days: int = 30):
    """
    Delete log files older than specified days.
    """
    if days < 1:
        raise HTTPException(status_code=400, detail="Days must be at least 1")
    
    log_dir = "logs"
    if not os.path.exists(log_dir):
        return CleanupResult(deleted_files=0, freed_space=0, message="No logs directory found")
    
    try:
        cutoff_date = datetime.now() - timedelta(days=days)
        deleted_count = 0
        freed_space = 0
        
        for log_file in glob.glob(os.path.join(log_dir, "*.log*")):
            file_time = datetime.fromtimestamp(os.path.getmtime(log_file))
            
            if file_time < cutoff_date:
                file_size = os.path.getsize(log_file)
                os.remove(log_file)
                deleted_count += 1
                freed_space += file_size
                logger.info(f"Deleted old log: {log_file}")
        
        message = f"Deleted {deleted_count} log files older than {days} days"
        logger.info(message)
        
        return CleanupResult(
            deleted_files=deleted_count,
            freed_space=freed_space,
            message=message
        )
        
    except Exception as e:
        logger.error(f"Error cleaning up logs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cleaning up logs: {str(e)}"
        )

@router.get("/database-stats", response_model=SystemStats)
async def get_database_stats():
    """
    Get database statistics and system information.
    """
    try:
        with engine.connect() as conn:
            # Get total students
            result = conn.execute(text("SELECT COUNT(*) FROM public.estudiantes"))
            total_students = result.scalar()
            
            # Get total users
            result = conn.execute(text("SELECT COUNT(*) FROM public.usuarios"))
            total_users = result.scalar()
            
            # Get total attendances
            result = conn.execute(text("SELECT COUNT(*) FROM public.asistencias"))
            total_attendances = result.scalar()
            
            # Get total absences
            result = conn.execute(text("SELECT COUNT(*) FROM public.faltas"))
            total_absences = result.scalar()
            
            # Get database size
            result = conn.execute(text(
                f"SELECT pg_size_pretty(pg_database_size('{settings.POSTGRES_DB}'))"
            ))
            database_size = result.scalar()
        
        # Get backup count
        backup_dir = "backups"
        backup_count = 0
        if os.path.exists(backup_dir):
            backup_count = len([f for f in os.listdir(backup_dir) 
                              if f.endswith('.dump') or f.endswith('.sql')])
        
        return SystemStats(
            total_students=total_students,
            total_users=total_users,
            total_attendances=total_attendances,
            total_absences=total_absences,
            database_size=database_size,
            backup_count=backup_count
        )
        
    except Exception as e:
        logger.error(f"Error getting database stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting database stats: {str(e)}"
        )

@router.get("/table-stats", response_model=List[DatabaseStats])
async def get_table_stats():
    """
    Get detailed statistics for each table in the database.
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    schemaname || '.' || relname AS table_name,
                    n_live_tup AS row_count,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) AS total_size
                FROM pg_stat_user_tables
                ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC
            """))
            
            stats = []
            for row in result:
                stats.append(DatabaseStats(
                    table_name=row[0],
                    row_count=row[1],
                    total_size=row[2]
                ))
            
            return stats
            
    except Exception as e:
        logger.error(f"Error getting table stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting table stats: {str(e)}"
        )

