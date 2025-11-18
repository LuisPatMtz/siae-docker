# app/models/grupo.py
"""
Modelo de Grupo: grupos escolares (1A, 2B, etc).
"""
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

class Grupo(SQLModel, table=True):
    """Tabla de grupos escolares"""
    __tablename__ = "grupo"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=50, unique=True)
    turno: Optional[str] = Field(max_length=50, default=None)
    semestre: int = Field(ge=1, le=6, index=True)
    
    # Relaciones
    estudiantes: List["Estudiante"] = Relationship(back_populates="grupo")  # noqa: F821


# --- DTOs ---

class GrupoCreate(SQLModel):
    """DTO para crear un grupo"""
    nombre: str
    turno: Optional[str] = None
    semestre: int = Field(ge=1, le=6)


class GrupoRead(SQLModel):
    """DTO para leer un grupo"""
    id: int
    nombre: str
    turno: Optional[str]
    semestre: int


class GrupoUpdate(SQLModel):
    """DTO para actualizar un grupo"""
    nombre: Optional[str] = None
    turno: Optional[str] = None
    semestre: Optional[int] = Field(default=None, ge=1, le=6)
