from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
import subprocess
import os
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
import logging
import glob
import shutil
import pytz

from app.core.permissions import require_permission
from app.core.config import settings
from app.db.database import engine
from sqlalchemy import text
from app.core import timezone_manager

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

class TimezoneConfig(BaseModel):
    timezone: str

class TimezoneInfo(BaseModel):
    timezone: str
    offset: str
    offset_hours: float
    abbreviation: str
    current_time: str
    available_timezones: List[str]
    
class CleanupResult(BaseModel):
    deleted_files: int
    freed_space: int
    message: str

class LogEntry(BaseModel):
    timestamp: str
    level: str
    logger: str
    message: str
    line_number: int

class LogFileInfo(BaseModel):
    filename: str
    size: int
    modified: str
    line_count: int

class LogsResponse(BaseModel):
    entries: List[LogEntry]
    total_lines: int
    filtered_lines: int

@router.post("/backup", response_model=BackupInfo)
async def create_backup():
    """
    Creates a database backup using pg_dump.
    """
    try:
        # Log current working directory and permissions
        backup_dir = "backups"
        logger.info(f"Current working directory: {os.getcwd()}")
        if os.path.exists(backup_dir):
            logger.info(f"Permissions for '{backup_dir}' directory: {oct(os.stat(backup_dir).st_mode)}")
        else:
            logger.info(f"'{backup_dir}' directory does not exist, creating it.")

        timestamp = timezone_manager.now().strftime("%Y%m%d_%H%M%S")
        filename = f"backup_{timestamp}.dump"
        # Ensure backups directory exists
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
        created = timezone_manager.from_timestamp(os.path.getctime(filepath)).isoformat()
        
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
                 "created": timezone_manager.from_timestamp(created).isoformat()
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

@router.post("/upload-backup", response_model=BackupInfo)
async def upload_backup(file: UploadFile = File(...)):
    """
    Upload a backup file (.dump or .sql).
    """
    # Validate file extension
    if not (file.filename.endswith('.dump') or file.filename.endswith('.sql')):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Only .dump and .sql files are allowed"
        )
    
    # Security check for filename
    if ".." in file.filename or "/" in file.filename or "\\" in file.filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    backup_dir = "backups"
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    
    # Add timestamp prefix to avoid overwriting
    timestamp = timezone_manager.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"uploaded_{timestamp}_{file.filename}"
    filepath = os.path.join(backup_dir, safe_filename)
    
    try:
        # Read and save file
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)
        
        logger.info(f"Backup uploaded successfully: {safe_filename} ({len(content)} bytes)")
        
        size = os.path.getsize(filepath)
        created = timezone_manager.from_timestamp(os.path.getctime(filepath)).isoformat()
        
        return {
            "filename": safe_filename,
            "size": size,
            "created": created
        }
        
    except Exception as e:
        # Clean up file if it was partially written
        if os.path.exists(filepath):
            os.remove(filepath)
        
        error_msg = f"Error uploading backup: {str(e)}"
        logger.error(error_msg)
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
        cutoff_date = timezone_manager.now() - timedelta(days=days)
        deleted_count = 0
        freed_space = 0
        
        for log_file in glob.glob(os.path.join(log_dir, "*.log*")):
            file_time = timezone_manager.from_timestamp(os.path.getmtime(log_file))
            
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

@router.get("/log-files", response_model=List[LogFileInfo])
async def get_log_files():
    """
    Get list of all log files with metadata.
    """
    log_dir = "logs"
    if not os.path.exists(log_dir):
        return []
    
    try:
        log_files = []
        for log_file in sorted(glob.glob(os.path.join(log_dir, "*.log*")), 
                              key=os.path.getmtime, reverse=True):
            stat = os.stat(log_file)
            
            # Count lines in file
            with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                line_count = sum(1 for _ in f)
            
            log_files.append(LogFileInfo(
                filename=os.path.basename(log_file),
                size=stat.st_size,
                modified=timezone_manager.from_timestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
                line_count=line_count
            ))
        
        return log_files
    except Exception as e:
        logger.error(f"Error listing log files: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing log files: {str(e)}"
        )

@router.get("/logs", response_model=LogsResponse)
async def get_logs(
    filename: Optional[str] = None,
    level: Optional[str] = None,
    logger_name: Optional[str] = None,
    limit: int = 100,
    search: Optional[str] = None
):
    """
    Get logs with optional filtering by filename, level, logger, and search term.
    Supported levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
    """
    log_dir = "logs"
    
    if not os.path.exists(log_dir):
        return LogsResponse(entries=[], total_lines=0, filtered_lines=0)
    
    try:
        # Determine which file to read
        if filename:
            log_file = os.path.join(log_dir, filename)
            if not os.path.exists(log_file):
                raise HTTPException(status_code=404, detail="Log file not found")
            log_files = [log_file]
        else:
            # Read from most recent log file
            log_files = sorted(glob.glob(os.path.join(log_dir, "*.log")), 
                             key=os.path.getmtime, reverse=True)
            if not log_files:
                return LogsResponse(entries=[], total_lines=0, filtered_lines=0)
            log_files = log_files[:1]  # Only most recent
        
        entries = []
        total_lines = 0
        
        import re
        # Pattern to match log lines: 2025-11-27 21:39:07,958 - siae.api - INFO - message
        log_pattern = re.compile(
            r'^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d{3})\s+-\s+'  # timestamp
            r'([\w\.]+)\s+-\s+'  # logger name
            r'(\w+)\s+-\s+'  # level
            r'(.+)$',  # message
            re.MULTILINE
        )
        
        for log_file in log_files:
            with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
                total_lines += len(lines)
                
                for line_num, line in enumerate(lines, 1):
                    match = log_pattern.match(line.strip())
                    if not match:
                        continue
                    
                    timestamp, log_logger, log_level, message = match.groups()
                    
                    # Apply filters
                    if level and log_level != level:
                        continue
                    if logger_name and logger_name not in log_logger:
                        continue
                    if search and search.lower() not in message.lower():
                        continue
                    
                    entries.append(LogEntry(
                        timestamp=timestamp,
                        level=log_level,
                        logger=log_logger,
                        message=message.strip(),
                        line_number=line_num
                    ))
        
        # Get last N entries
        entries = entries[-limit:] if len(entries) > limit else entries
        entries.reverse()  # Most recent first
        
        return LogsResponse(
            entries=entries,
            total_lines=total_lines,
            filtered_lines=len(entries)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading logs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading logs: {str(e)}"
        )

@router.get("/database-stats", response_model=SystemStats)
async def get_database_stats():
    """
    Get database statistics and system information.
    """
    try:
        with engine.connect() as conn:
            # Get total students
            result = conn.execute(text("SELECT COUNT(*) FROM public.estudiante"))
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

# ============================================
# ENDPOINTS DE CONFIGURACIÓN DE ZONA HORARIA
# ============================================

@router.get("/timezone", response_model=TimezoneInfo)
async def get_timezone_info():
    """
    Obtiene información de la zona horaria configurada actualmente.
    """
    try:
        info = timezone_manager.get_timezone_info()
        info['available_timezones'] = timezone_manager.get_available_timezones()
        return info
    except Exception as e:
        logger.error(f"Error getting timezone info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting timezone info: {str(e)}"
        )

@router.put("/timezone", response_model=TimezoneInfo)
async def update_timezone(config: TimezoneConfig):
    """
    Actualiza la zona horaria del sistema.
    Todos los módulos usarán esta zona horaria automáticamente.
    """
    try:
        timezone_manager.set_timezone_config(config.timezone)
        logger.info(f"Timezone updated to: {config.timezone}")
        
        # Retornar la nueva información
        info = timezone_manager.get_timezone_info()
        info['available_timezones'] = timezone_manager.get_available_timezones()
        return info
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating timezone: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating timezone: {str(e)}"
        )

@router.get("/timezones", response_model=List[str])
async def list_available_timezones():
    """
    Lista todas las zonas horarias disponibles para configuración.
    """
    return timezone_manager.get_available_timezones()

