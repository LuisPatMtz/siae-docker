# app/models/dashboard.py
"""
Modelos de DTOs para el dashboard y estadísticas.
"""
from typing import Dict, List
from sqlmodel import SQLModel

class StatsData(SQLModel):
    """Estadísticas básicas del dashboard"""
    totalStudents: int
    averageAttendance: float


class TurnoDataResponse(SQLModel):
    """Respuesta con datos de turno (matutino/vespertino)"""
    stats: StatsData
    groups: Dict[str, List[str]]


class GrupoAsistenciaResponse(SQLModel):
    """Respuesta con asistencia de un grupo"""
    totalStudents: int
    attendance: Dict[str, float]
