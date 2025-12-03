# app/services/dashboard_service.py
"""
Servicio de lógica de negocio para Dashboard y estadísticas.
"""
import calendar
import logging
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional
from sqlmodel import Session, select, func, distinct
from fastapi import HTTPException, status
import pytz

from app.models import (
    Estudiante, Asistencia, NFC, Grupo, CicloEscolar,
    StatsData, TurnoDataResponse, GrupoAsistenciaResponse
)

logger = logging.getLogger("siae.dashboard")


class DashboardService:
    """Servicio para gestionar estadísticas del dashboard"""
    
    MEXICO_TZ = pytz.timezone('America/Mexico_City')
    
    def __init__(self, session: Session):
        self.session = session
    
    # --- MÉTODOS AUXILIARES ---
    
    def get_dias_habiles(self, start_date: date, end_date: date) -> int:
        """Calcula el número de días hábiles (L-V) en un rango de fechas."""
        dias_habiles = 0
        current_date = start_date
        while current_date <= end_date:
            # weekday() devuelve 0 para lunes y 6 para domingo
            if current_date.weekday() < 5: 
                dias_habiles += 1
            current_date += timedelta(days=1)
        return dias_habiles
    
    def get_asistencia_porcentaje(
        self, 
        estudiantes_ids: List[str], 
        start_date: date, 
        end_date: date
    ) -> float:
        """
        Calcula el porcentaje de asistencia para una lista de estudiantes en un rango de fechas.
        """
        logger.info(f"[DEBUG] get_asistencia_porcentaje called with {len(estudiantes_ids)} estudiantes")
        logger.info(f"[DEBUG] Fecha range: {start_date} to {end_date}")
        
        if not estudiantes_ids:
            logger.info("[DEBUG] No estudiantes_ids, returning 0.0")
            return 0.0

        total_estudiantes = len(estudiantes_ids)
        dias_habiles = self.get_dias_habiles(start_date, end_date)
        
        logger.info(f"[DEBUG] Dias habiles: {dias_habiles}")
        
        # Si no hay días hábiles, la asistencia es 0
        if dias_habiles == 0:
            logger.info("[DEBUG] Dias habiles = 0, returning 0.0")
            return 0.0

        # Asistencias totales posibles
        asistencias_posibles = total_estudiantes * dias_habiles

        if asistencias_posibles == 0:
            logger.info("[DEBUG] Asistencias posibles = 0, returning 0.0")
            return 0.0

        logger.info(f"[DEBUG] Asistencias posibles: {asistencias_posibles}")

        # Contar las asistencias reales (días distintos con entrada válida)
        # La tabla asistencias ya tiene matricula_estudiante, tipo y timestamp directamente
        subquery = (
            select(
                Asistencia.matricula_estudiante, 
                func.count(distinct(func.date(Asistencia.timestamp))).label("dias_asistidos")
            )
            .where(
                Asistencia.matricula_estudiante.in_(estudiantes_ids),
                Asistencia.tipo == "entrada",
                Asistencia.es_valida == True,
                func.date(Asistencia.timestamp) >= start_date,
                func.date(Asistencia.timestamp) <= end_date
            )
            .group_by(Asistencia.matricula_estudiante)
        ).subquery()

        logger.info("[DEBUG] Executing subquery...")
        
        # Sumamos el total de días asistidos por todos los estudiantes
        total_asistencias_reales_result = self.session.exec(
            select(func.sum(subquery.c.dias_asistidos))
        ).first()

        total_asistencias_reales = total_asistencias_reales_result or 0.0
        
        logger.info(f"[DEBUG] Total asistencias reales: {total_asistencias_reales}")

        # Calcular el porcentaje
        porcentaje = (total_asistencias_reales / asistencias_posibles) * 100
        logger.info(f"[DEBUG] Porcentaje calculado: {porcentaje}")
        return round(porcentaje, 1)
    
    def get_ciclo_activo(self) -> CicloEscolar:
        """Obtiene el ciclo escolar activo"""
        ciclo_activo = self.session.exec(
            select(CicloEscolar).where(CicloEscolar.activo == True)
        ).first()
        
        if not ciclo_activo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No hay un ciclo escolar activo."
            )
        
        return ciclo_activo
    
    # --- ENDPOINTS DE SERVICIO ---
    
    def get_turno_data(self, modo: str = "general") -> TurnoDataResponse:
        """
        Obtiene las estadísticas generales y la lista de grupos por turno.
        """
        ciclo_activo = self.get_ciclo_activo()
        
        # Obtener estudiantes del ciclo activo
        estudiantes_query = select(Estudiante).where(Estudiante.id_ciclo == ciclo_activo.id)
        
        # Filtrar por turno si se especifica
        if modo != "general":
            estudiantes_query = (
                estudiantes_query
                .join(Grupo, Estudiante.id_grupo == Grupo.id)
                .where(Grupo.turno == modo)
            )
        
        estudiantes = self.session.exec(estudiantes_query).all()
        
        total_estudiantes = len(estudiantes)
        estudiantes_ids = [e.matricula for e in estudiantes]

        logger.info(f"[DEBUG get_turno_data] Total estudiantes: {total_estudiantes}")
        logger.info(f"[DEBUG get_turno_data] IDs: {estudiantes_ids}")
        logger.info(f"[DEBUG get_turno_data] Ciclo: {ciclo_activo.fecha_inicio} to {ciclo_activo.fecha_fin}")

        # Calcular asistencia promedio del ciclo completo
        asistencia_promedio = self.get_asistencia_porcentaje(
            estudiantes_ids, 
            ciclo_activo.fecha_inicio, 
            ciclo_activo.fecha_fin
        )
        
        logger.info(f"[DEBUG get_turno_data] Asistencia promedio result: {asistencia_promedio}")
        
        stats = StatsData(
            totalStudents=total_estudiantes, 
            averageAttendance=asistencia_promedio
        )

        # Agrupar por turnos
        grupos_query = select(Grupo).order_by(Grupo.nombre)
        if modo != "general":
            grupos_query = grupos_query.where(Grupo.turno == modo)
        
        grupos = self.session.exec(grupos_query).all()
        
        grupos_agrupados: Dict[str, List[str]] = {}
        
        for grupo in grupos:
            turno = grupo.turno or "Sin turno"
            
            if turno not in grupos_agrupados:
                grupos_agrupados[turno] = []
            
            grupos_agrupados[turno].append(grupo.nombre)

        # Ordenar los grupos dentro de cada turno
        for turno in grupos_agrupados:
            grupos_agrupados[turno].sort()

        return TurnoDataResponse(stats=stats, groups=grupos_agrupados)
    
    def get_grupo_data(self, grupo_id: int, periodo: str = "semester") -> GrupoAsistenciaResponse:
        """
        Obtiene las estadísticas de asistencia para un grupo específico.
        """
        today = datetime.now(self.MEXICO_TZ).date()
        
        # Verificar que el grupo existe
        grupo = self.session.get(Grupo, grupo_id)
        if not grupo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Grupo con ID {grupo_id} no encontrado."
            )
        
        ciclo_activo = self.get_ciclo_activo()
        
        # Obtener estudiantes del grupo
        estudiantes = self.session.exec(
            select(Estudiante).where(
                Estudiante.id_grupo == grupo_id,
                Estudiante.id_ciclo == ciclo_activo.id
            )
        ).all()
        
        if not estudiantes:
            return GrupoAsistenciaResponse(
                totalStudents=0,
                attendance={periodo: 0.0}
            )
            
        estudiantes_ids = [e.matricula for e in estudiantes]
        total_estudiantes = len(estudiantes_ids)

        # Definir el rango de fechas según el período
        start_date = today
        end_date = today

        if periodo == "week":
            # Lunes de esta semana
            start_date = today - timedelta(days=today.weekday())
            # Domingo de esta semana
            end_date = start_date + timedelta(days=6)
        
        elif periodo == "month":
            # Primer día de este mes
            start_date = today.replace(day=1)
            # Último día de este mes
            last_day_of_month = calendar.monthrange(today.year, today.month)[1]
            end_date = today.replace(day=last_day_of_month)
        
        elif periodo == "semester":
            # Usar las fechas del ciclo activo
            start_date = ciclo_activo.fecha_inicio
            end_date = ciclo_activo.fecha_fin
                
        # Calcular la asistencia
        porcentaje_asistencia = self.get_asistencia_porcentaje(
            estudiantes_ids, 
            start_date, 
            end_date
        )

        return GrupoAsistenciaResponse(
            totalStudents=total_estudiantes,
            attendance={periodo: porcentaje_asistencia}
        )
    
    def get_estadisticas_resumen(self) -> dict:
        """Obtiene un resumen general de estadísticas del sistema."""
        ciclo_activo = self.get_ciclo_activo()
        
        # Contar estudiantes totales en el ciclo activo
        total_estudiantes = self.session.exec(
            select(func.count(Estudiante.matricula))
            .where(Estudiante.id_ciclo == ciclo_activo.id)
        ).first()
        
        # Contar estudiantes con NFC
        estudiantes_con_nfc = self.session.exec(
            select(func.count(distinct(NFC.matricula_estudiante)))
            .join(Estudiante, NFC.matricula_estudiante == Estudiante.matricula)
            .where(Estudiante.id_ciclo == ciclo_activo.id)
        ).first()
        
        # Contar accesos de hoy (entradas)
        hoy = datetime.now(self.MEXICO_TZ).date()
        accesos_hoy = self.session.exec(
            select(func.count(Asistencia.id))
            .where(
                func.date(Asistencia.timestamp) == hoy,
                Asistencia.tipo == "entrada"
            )
        ).first()
        
        # Contar grupos
        total_grupos = self.session.exec(
            select(func.count(Grupo.id))
        ).first()
        
        return {
            "ciclo_activo": {
                "id": ciclo_activo.id,
                "nombre": ciclo_activo.nombre,
                "fecha_inicio": ciclo_activo.fecha_inicio,
                "fecha_fin": ciclo_activo.fecha_fin
            },
            "estudiantes": {
                "total": total_estudiantes,
                "con_nfc": estudiantes_con_nfc,
                "sin_nfc": total_estudiantes - estudiantes_con_nfc
            },
            "accesos_hoy": accesos_hoy,
            "total_grupos": total_grupos
        }
    
    def get_estadisticas_periodos(
        self,
        turno: Optional[str] = None,
        grupo_id: Optional[int] = None
    ) -> dict:
        """
        Obtiene estadísticas de asistencia por períodos (semana, mes, ciclo).
        """
        ciclo_activo = self.get_ciclo_activo()
        
        # Base query para estudiantes
        estudiantes_query = select(Estudiante).where(Estudiante.id_ciclo == ciclo_activo.id)
        
        # Aplicar filtros
        if grupo_id:
            estudiantes_query = estudiantes_query.where(Estudiante.id_grupo == grupo_id)
        elif turno:
            estudiantes_query = (
                estudiantes_query
                .join(Grupo, Estudiante.id_grupo == Grupo.id, isouter=True)
                .where(Grupo.turno == turno)
            )
        
        estudiantes = self.session.exec(estudiantes_query).all()
        estudiantes_ids = [e.matricula for e in estudiantes]
        
        # Calcular fechas
        hoy = datetime.now(self.MEXICO_TZ).date()
        
        # Semana actual (Lunes a Domingo)
        inicio_semana = hoy - timedelta(days=hoy.weekday())
        fin_semana = inicio_semana + timedelta(days=6)
        
        # Mes actual
        inicio_mes = hoy.replace(day=1)
        ultimo_dia_mes = calendar.monthrange(hoy.year, hoy.month)[1]
        fin_mes = hoy.replace(day=ultimo_dia_mes)
        
        # Ciclo completo
        inicio_ciclo = ciclo_activo.fecha_inicio
        fin_ciclo = ciclo_activo.fecha_fin
        
        # Calcular porcentajes de asistencia
        asistencia_semana = self.get_asistencia_porcentaje(estudiantes_ids, inicio_semana, fin_semana)
        asistencia_mes = self.get_asistencia_porcentaje(estudiantes_ids, inicio_mes, fin_mes)
        asistencia_ciclo = self.get_asistencia_porcentaje(estudiantes_ids, inicio_ciclo, fin_ciclo)
        
        return {
            "week": {
                "porcentaje": asistencia_semana,
                "inicio": str(inicio_semana),
                "fin": str(fin_semana),
                "dias_habiles": self.get_dias_habiles(inicio_semana, fin_semana)
            },
            "month": {
                "porcentaje": asistencia_mes,
                "inicio": str(inicio_mes),
                "fin": str(fin_mes),
                "dias_habiles": self.get_dias_habiles(inicio_mes, fin_mes)
            },
            "semester": {
                "porcentaje": asistencia_ciclo,
                "inicio": str(inicio_ciclo),
                "fin": str(fin_ciclo),
                "dias_habiles": self.get_dias_habiles(inicio_ciclo, fin_ciclo)
            }
        }
