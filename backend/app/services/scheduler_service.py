# app/services/scheduler_service.py
"""
Servicio para gestionar tareas programadas (cron jobs).
Permite programar backups automáticos y cortes de faltas.
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging
import subprocess
import os
import pytz
from typing import Optional
from sqlmodel import Session, select
from app.db.database import get_session, engine
from app.models import SystemConfig

logger = logging.getLogger(__name__)

# Zona horaria de México (UTC-6)
MEXICO_TZ = pytz.timezone('America/Mexico_City')

class SchedulerService:
    _scheduler: Optional[BackgroundScheduler] = None
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        # Inicializar scheduler con zona horaria de México
        self._scheduler = BackgroundScheduler(timezone=MEXICO_TZ)
        self._scheduler.start()
        self._initialized = True
        logger.info(f"Scheduler iniciado con zona horaria: {MEXICO_TZ}")
    
    def get_scheduler(self) -> BackgroundScheduler:
        """Obtiene la instancia del scheduler"""
        return self._scheduler
    
    def schedule_backup(self, hour: int, minute: int, enabled: bool = True):
        """
        Programa un backup automático diario.
        
        Args:
            hour: Hora (0-23)
            minute: Minuto (0-59)
            enabled: Si está habilitado o no
        """
        job_id = "auto_backup"
        
        # Remover job existente si existe
        if self._scheduler.get_job(job_id):
            self._scheduler.remove_job(job_id)
        
        if not enabled:
            logger.info(f"Backup automático deshabilitado")
            return
        
        # Crear trigger cron con zona horaria de México
        trigger = CronTrigger(hour=hour, minute=minute, timezone=MEXICO_TZ)
        
        # Agregar job
        self._scheduler.add_job(
            self._run_backup,
            trigger=trigger,
            id=job_id,
            name="Backup Automático",
            replace_existing=True
        )
        
        logger.info(f"Backup automático programado: {hour:02d}:{minute:02d} (Hora de México, UTC-6)")
    
    def schedule_faltas_cut(self, hour: int, minute: int, enabled: bool = True):
        """
        Programa un corte de faltas automático diario.
        
        Args:
            hour: Hora (0-23)
            minute: Minuto (0-59)
            enabled: Si está habilitado o no
        """
        job_id = "auto_faltas_cut"
        
        # Remover job existente si existe
        if self._scheduler.get_job(job_id):
            self._scheduler.remove_job(job_id)
        
        if not enabled:
            logger.info(f"Corte de faltas automático deshabilitado")
            return
        
        # Crear trigger cron con zona horaria de México
        trigger = CronTrigger(hour=hour, minute=minute, timezone=MEXICO_TZ)
        
        # Agregar job
        self._scheduler.add_job(
            self._run_faltas_cut,
            trigger=trigger,
            id=job_id,
            name="Corte de Faltas Automático",
            replace_existing=True
        )
        
        logger.info(f"Corte de faltas automático programado: {hour:02d}:{minute:02d} (Hora de México, UTC-6)")
    
    def _run_backup(self):
        """Ejecuta el backup automático"""
        try:
            logger.info("Ejecutando backup automático...")
            
            # Crear directorio de backups si no existe
            backup_dir = "/app/backups"
            os.makedirs(backup_dir, exist_ok=True)
            
            # Generar nombre del archivo
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"backup_{timestamp}.dump"
            filepath = os.path.join(backup_dir, filename)
            
            # Ejecutar pg_dump
            db_user = os.getenv("POSTGRES_USER", "siae_admin")
            db_name = os.getenv("POSTGRES_DB", "siae_db")
            db_host = os.getenv("DB_HOST", "db")
            
            command = [
                "pg_dump",
                "-h", db_host,
                "-U", db_user,
                "-F", "c",  # Custom format
                "-f", filepath,
                db_name
            ]
            
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                env={**os.environ, "PGPASSWORD": os.getenv("POSTGRES_PASSWORD", "admin123")}
            )
            
            if result.returncode == 0:
                logger.info(f"Backup automático completado: {filename}")
            else:
                logger.error(f"Error en backup automático: {result.stderr}")
                
        except Exception as e:
            logger.error(f"Error en backup automático: {e}")
    
    def _run_faltas_cut(self):
        """Ejecuta el corte de faltas automático"""
        try:
            logger.info("Ejecutando corte de faltas automático...")
            
            # Ejecutar el SQL directamente
            with Session(engine) as session:
                from sqlalchemy import text
                
                # Obtener la fecha actual
                fecha_corte = datetime.now().date()
                
                # SQL para generar faltas
                sql = text("""
                    INSERT INTO faltas (fecha_falta, id_estudiante, id_ciclo, justificada)
                    SELECT 
                        :fecha_corte,
                        e.id,
                        e.id_ciclo_escolar,
                        false
                    FROM estudiante e
                    WHERE e.id_ciclo_escolar IS NOT NULL
                    AND NOT EXISTS (
                        SELECT 1 FROM asistencias a
                        WHERE a.matricula = e.matricula
                        AND DATE(a.timestamp_entrada) = :fecha_corte
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM faltas f
                        WHERE f.id_estudiante = e.id
                        AND f.fecha_falta = :fecha_corte
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM justificaciones j
                        WHERE j.id_estudiante = e.id
                        AND DATE(j.fecha_inicio) <= :fecha_corte
                        AND DATE(j.fecha_fin) >= :fecha_corte
                        AND j.estado = 'aprobada'
                    )
                """)
                
                result = session.exec(sql, {"fecha_corte": fecha_corte})
                session.commit()
                
                logger.info(f"Corte de faltas completado para {fecha_corte}")
                
        except Exception as e:
            logger.error(f"Error en corte de faltas automático: {e}")
    
    def get_scheduled_jobs(self):
        """Obtiene información de los jobs programados"""
        jobs = []
        for job in self._scheduler.get_jobs():
            next_run = job.next_run_time.strftime("%Y-%m-%d %H:%M:%S") if job.next_run_time else "N/A"
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": next_run,
                "trigger": str(job.trigger)
            })
        return jobs
    
    def load_schedules_from_db(self):
        """Carga las configuraciones de horarios desde la base de datos"""
        from app.db.database import engine
        from sqlmodel import Session
        
        try:
            with Session(engine) as session:
                # Cargar configuración de backup
                backup_enabled = session.exec(
                    select(SystemConfig).where(SystemConfig.key == "auto_backup_enabled")
                ).first()
                backup_time = session.exec(
                    select(SystemConfig).where(SystemConfig.key == "auto_backup_time")
                ).first()
                
                if backup_enabled and backup_time:
                    enabled = backup_enabled.value.lower() == "true"
                    time_parts = backup_time.value.split(":")
                    hour = int(time_parts[0])
                    minute = int(time_parts[1])
                    self.schedule_backup(hour, minute, enabled)
                
                # Cargar configuración de corte de faltas
                faltas_enabled = session.exec(
                    select(SystemConfig).where(SystemConfig.key == "auto_faltas_cut_enabled")
                ).first()
                faltas_time = session.exec(
                    select(SystemConfig).where(SystemConfig.key == "auto_faltas_cut_time")
                ).first()
                
                if faltas_enabled and faltas_time:
                    enabled = faltas_enabled.value.lower() == "true"
                    time_parts = faltas_time.value.split(":")
                    hour = int(time_parts[0])
                    minute = int(time_parts[1])
                    self.schedule_faltas_cut(hour, minute, enabled)
                
                logger.info("Horarios cargados desde la base de datos")
        except Exception as e:
            logger.error(f"Error al cargar horarios desde DB: {e}")
    
    def shutdown(self):
        """Detiene el scheduler"""
        if self._scheduler and self._scheduler.running:
            self._scheduler.shutdown()
            logger.info("Scheduler detenido")

# Instancia global del scheduler
scheduler_service = SchedulerService()
