# app/models/justificacion.py
"""
Modelo de Justificación: registro simple de justificaciones de faltas.
"""
from typing import Optional
from datetime import datetime, timezone, timedelta
from sqlmodel import Field, SQLModel, Relationship


def mexico_now():
    """Retorna la fecha/hora actual en zona horaria de México (UTC-6)"""
    # Crear timezone de México (UTC-6)
    mexico_tz = timezone(timedelta(hours=-6))
    return datetime.now(mexico_tz)


class Justificacion(SQLModel, table=True):
    """Tabla de justificaciones - Registro simple de quién justificó y cuándo"""
    __tablename__ = "justificaciones"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    justificacion: str  # Texto de la justificación
    usuario_registro: Optional[str] = None  # Usuario que registró la justificación
    fecha_creacion: datetime = Field(default_factory=mexico_now)
    
    # Relación con faltas (una justificación puede aplicar a múltiples faltas)
    faltas: list["Falta"] = Relationship(back_populates="justificacion_rel")  # noqa: F821


# --- DTOs ---

class JustificacionCreate(SQLModel):
    """DTO para crear una justificación"""
    justificacion: str
    usuario_registro: Optional[str] = None


class JustificacionRead(SQLModel):
    """DTO para leer una justificación"""
    id: int
    justificacion: str
    usuario_registro: Optional[str]
    fecha_creacion: datetime
