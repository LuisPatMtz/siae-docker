# app/models/acceso.py
"""
Modelo de Acceso: registro de accesos mediante tarjetas NFC.
"""
from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship
from app.models.utils import get_mexico_time

class Acceso(SQLModel, table=True):
    """Tabla de registros de acceso"""
    __tablename__ = "accesos"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nfc_uid: str = Field(foreign_key="nfc.nfc_uid")
    id_ciclo: int = Field(foreign_key="ciclo_escolar.id")
    hora_registro: datetime = Field(default_factory=get_mexico_time)
    
    # Relaciones
    nfc: "NFC" = Relationship(back_populates="accesos")  # noqa: F821
    ciclo: "CicloEscolar" = Relationship(back_populates="accesos")  # noqa: F821


# --- DTOs ---

class AccesoCreate(SQLModel):
    """DTO para crear un registro de acceso"""
    nfc_uid: str
    id_ciclo: int


class AccesoRead(SQLModel):
    """DTO para leer un registro de acceso"""
    id: int
    nfc_uid: str
    id_ciclo: int
    hora_registro: datetime
