# app/models/asistencia.py
"""
Modelo de Asistencia: registro de entradas y salidas con validación.
"""
from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship
from app.models.utils import get_mexico_time

class Asistencia(SQLModel, table=True):
    """Tabla de asistencias (entrada/salida) con validación de rango 1-8 horas"""
    __tablename__ = "asistencias"

    id: Optional[int] = Field(default=None, primary_key=True)
    matricula_estudiante: str = Field(foreign_key="estudiante.matricula")
    id_ciclo: int = Field(foreign_key="ciclo_escolar.id")  # Ciclo escolar al que pertenece
    tipo: str = Field(max_length=10)  # 'entrada' o 'salida'
    timestamp: datetime = Field(default_factory=get_mexico_time)
    
    # Campos de validación
    es_valida: Optional[bool] = Field(default=None)  # True si cumple rango 1-8h, False si no, None si pendiente
    entrada_relacionada_id: Optional[int] = Field(default=None)  # ID de la entrada asociada (solo para salidas)

    estudiante: "Estudiante" = Relationship(back_populates="asistencias")  # noqa: F821
    ciclo: "CicloEscolar" = Relationship()  # noqa: F821

# --- DTOs ---
class AsistenciaCreate(SQLModel):
    matricula_estudiante: str
    id_ciclo: int
    tipo: str

class AsistenciaRead(SQLModel):
    id: int
    matricula_estudiante: str
    id_ciclo: int
    tipo: str
    timestamp: datetime
    es_valida: Optional[bool] = None
    entrada_relacionada_id: Optional[int] = None
