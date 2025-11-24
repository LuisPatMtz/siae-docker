# app/models/asistencia.py
"""
Modelo de Asistencia: registro de entradas y salidas.
"""
from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship

class Asistencia(SQLModel, table=True):
    """Tabla de asistencias (entrada/salida)"""
    __tablename__ = "asistencias"

    id: Optional[int] = Field(default=None, primary_key=True)
    matricula_estudiante: str = Field(foreign_key="estudiante.matricula")
    tipo: str = Field(max_length=10)  # 'entrada' o 'salida'
    timestamp: datetime = Field(default_factory=datetime.now)

    estudiante: "Estudiante" = Relationship(back_populates="asistencias")  # noqa: F821

# --- DTOs ---
class AsistenciaCreate(SQLModel):
    matricula_estudiante: str
    tipo: str

class AsistenciaRead(SQLModel):
    id: int
    matricula_estudiante: str
    tipo: str
    timestamp: datetime
