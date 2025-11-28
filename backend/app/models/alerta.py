# app/models/alerta.py
"""
Modelo de Alerta: registro de alertas de estudiantes con historial.
"""
from typing import Optional, List
from datetime import date, datetime
from sqlmodel import Field, SQLModel, Relationship

class Alerta(SQLModel, table=True):
    """Tabla de alertas de estudiantes"""
    __tablename__ = "alertas"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    matricula_estudiante: str = Field(foreign_key="estudiante.matricula")
    id_ciclo: int = Field(foreign_key="ciclo_escolar.id")  # Ciclo al que pertenece la alerta
    tipo: str  # "Faltas", "Retardos", "Conducta", etc.
    mensaje: str
    fecha_creacion: date
    fecha_modificacion: Optional[datetime] = None
    estado: str = "Activa"  # "Activa", "Justificada", "Cerrada"
    cantidad_faltas: int = Field(default=0)  # Total de faltas acumuladas
    justificacion_id: Optional[int] = Field(default=None, foreign_key="justificaciones.id")  # ID de justificación
    justificacion: Optional[str] = None  # Justificación si se resuelve (deprecated, usar justificacion_id)
    fecha_justificacion: Optional[date] = None  # Cuando se justificó
    
    # Relaciones
    ciclo: "CicloEscolar" = Relationship()  # noqa: F821
    justificacion_rel: Optional["Justificacion"] = Relationship()  # noqa: F821
    historial: List["AlertaHistorial"] = Relationship(back_populates="alerta")


class AlertaHistorial(SQLModel, table=True):
    """Tabla de historial de cambios en alertas"""
    __tablename__ = "alertas_historial"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    id_alerta: int = Field(foreign_key="alertas.id")
    accion: str  # "Creada", "Falta Agregada", "Justificada", "Cerrada"
    descripcion: str
    cantidad_faltas_momento: int  # Faltas al momento de esta acción
    fecha: datetime = Field(default_factory=datetime.now)
    usuario: Optional[str] = None  # Quien realizó la acción
    
    # Relación
    alerta: Alerta = Relationship(back_populates="historial")


class AlertaCreate(SQLModel):
    """DTO para crear una alerta"""
    matricula_estudiante: str
    id_ciclo: int
    tipo: str
    mensaje: str
    fecha_creacion: date
    cantidad_faltas: int = 0
    estado: str = "Activa"

class AlertaRead(SQLModel):
    """DTO para leer una alerta"""
    id: int
    matricula_estudiante: str
    id_ciclo: int
    tipo: str
    mensaje: str
    fecha_creacion: date
    fecha_modificacion: Optional[datetime]
    estado: str
    cantidad_faltas: int
    justificacion_id: Optional[int]
    justificacion: Optional[str]
    fecha_justificacion: Optional[date]

class AlertaUpdate(SQLModel):
    """DTO para actualizar una alerta"""
    estado: Optional[str] = None
    justificacion_id: Optional[int] = None
    justificacion: Optional[str] = None
    cantidad_faltas: Optional[int] = None

class AlertaHistorialRead(SQLModel):
    """DTO para leer historial de alerta"""
    id: int
    id_alerta: int
    accion: str
    descripcion: str
    cantidad_faltas_momento: int
    fecha: datetime
    usuario: Optional[str]
