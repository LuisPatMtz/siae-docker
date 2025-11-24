# app/models/usuario.py
"""
Modelo de Usuario: autenticación y permisos.
"""
from typing import TYPE_CHECKING, Optional, List, Dict, Any
from sqlmodel import Field, SQLModel, Column, JSON, Relationship

if TYPE_CHECKING:
    from app.models.estudiante import Estudiante

class Usuario(SQLModel, table=True):
    """Tabla de usuarios del sistema"""
    __tablename__ = "usuarios"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(max_length=50, unique=True)
    hashed_password: str
    full_name: Optional[str] = Field(default=None, max_length=100)
    role: str = Field(default="Usuario", max_length=50)
    permissions: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    
    estudiante: Optional["Estudiante"] = Relationship(back_populates="usuario")
