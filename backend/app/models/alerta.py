# app/models/alerta.py
"""
Modelo de Alerta: registro de alertas de estudiantes.
"""
from typing import Optional
from datetime import date
from sqlmodel import Field, SQLModel

class Alerta(SQLModel, table=True):
    """Tabla de alertas de estudiantes"""
    __tablename__ = "alertas"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    matricula_estudiante: str = Field(foreign_key="estudiante.matricula")
    tipo: str
    mensaje: str
    fecha: date
    estado: str = "Activa"

class AlertaCreate(SQLModel):
    """DTO para crear una alerta"""
    matricula_estudiante: str
    tipo: str
    mensaje: str
    fecha: date
    estado: str = "Activa"

class AlertaRead(SQLModel):
    """DTO para leer una alerta"""
    id: int
    matricula_estudiante: str
    tipo: str
    mensaje: str
    fecha: date
    estado: str
