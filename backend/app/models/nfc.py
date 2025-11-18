# app/models/nfc.py
"""
Modelo de NFC: vinculación de tarjetas NFC con estudiantes.
"""
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

class NFC(SQLModel, table=True):
    """Tabla de tarjetas NFC"""
    __tablename__ = "nfc"
    
    nfc_uid: str = Field(primary_key=True, max_length=50)
    matricula_estudiante: str = Field(foreign_key="estudiante.matricula", unique=True)
    
    # Relaciones con cascade delete
    estudiante: "Estudiante" = Relationship(back_populates="nfc")  # noqa: F821
    accesos: List["Acceso"] = Relationship(  # noqa: F821
        back_populates="nfc",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


# --- DTOs ---

class NFCCreate(SQLModel):
    """DTO para crear/vincular una tarjeta NFC"""
    nfc_uid: str
    matricula_estudiante: str


class NFCRead(SQLModel):
    """DTO para leer una tarjeta NFC"""
    nfc_uid: str
    matricula_estudiante: str


class NfcPayload(SQLModel):
    """DTO para el endpoint de registro de acceso"""
    nfc_uid: str
    fecha_registro: Optional[str] = None  # Para modo de prueba, formato YYYY-MM-DD
