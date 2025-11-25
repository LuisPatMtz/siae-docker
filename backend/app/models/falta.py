# app/models/falta.py
"""
Modelo de Falta: registro de ausencias de estudiantes.
"""
from typing import Optional
from datetime import date
from sqlmodel import Field, SQLModel, Relationship, UniqueConstraint

class Falta(SQLModel, table=True):
    """Tabla de faltas de estudiantes"""
    __tablename__ = "faltas"
    
    __table_args__ = (UniqueConstraint("matricula_estudiante", "fecha", name="unique_student_date"),)
    
    id: Optional[int] = Field(default=None, primary_key=True)
    matricula_estudiante: str = Field(foreign_key="estudiante.matricula")
    id_ciclo: int = Field(foreign_key="ciclo_escolar.id")
    fecha: date
    estado: str = Field(default="Sin justificar", max_length=50)  # "Sin justificar", "Justificada"
    justificacion: Optional[str] = Field(default=None)
    fecha_justificacion: Optional[date] = None
    id_alerta_asociada: Optional[int] = Field(default=None, foreign_key="alertas.id")  # Alerta relacionada
    
    # Relaciones
    estudiante: "Estudiante" = Relationship(back_populates="faltas")  # noqa: F821
    ciclo: "CicloEscolar" = Relationship(back_populates="faltas")  # noqa: F821


# --- DTOs ---

class FaltaCreate(SQLModel):
    """DTO para crear una falta"""
    matricula_estudiante: str
    id_ciclo: int
    fecha: date
    estado: str = "Sin justificar"
    justificacion: Optional[str] = None


class FaltaRead(SQLModel):
    """DTO para leer una falta"""
    id: int
    matricula_estudiante: str
    id_ciclo: int
    fecha: date
    estado: str
    justificacion: Optional[str]
    fecha_justificacion: Optional[date]
    id_alerta_asociada: Optional[int]


class FaltaUpdate(SQLModel):
    """DTO para actualizar una falta"""
    estado: Optional[str] = None
    justificacion: Optional[str] = None
    fecha_justificacion: Optional[date] = None
