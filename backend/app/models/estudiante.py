# app/models/estudiante.py
"""
Modelo de Estudiante: información de estudiantes.
"""
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

class Estudiante(SQLModel, table=True):
    """Tabla de estudiantes"""
    __tablename__ = "estudiante"
    
    matricula: str = Field(primary_key=True, max_length=30)
    nombre: str = Field(max_length=100)
    apellido: str = Field(max_length=100)
    correo: Optional[str] = Field(max_length=100, unique=True, default=None)
    id_grupo: Optional[int] = Field(default=None, foreign_key="grupo.id")
    id_ciclo: Optional[int] = Field(default=None, foreign_key="ciclo_escolar.id")
    id_usuario: Optional[int] = Field(default=None, foreign_key="usuarios.id")
    
    # Relaciones con cascade delete
    grupo: Optional["Grupo"] = Relationship(back_populates="estudiantes")  # noqa: F821
    ciclo: Optional["CicloEscolar"] = Relationship(back_populates="estudiantes")  # noqa: F821
    usuario: Optional["Usuario"] = Relationship(back_populates="estudiante")  # noqa: F821
    nfc: Optional["NFC"] = Relationship(  # noqa: F821
        back_populates="estudiante",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    faltas: List["Falta"] = Relationship(  # noqa: F821
        back_populates="estudiante",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    asistencias: List["Asistencia"] = Relationship(  # noqa: F821
        back_populates="estudiante",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )



# --- DTOs ---

class EstudianteCreate(SQLModel):
    """DTO para crear un estudiante"""
    matricula: str
    nombre: str
    apellido: str
    correo: Optional[str] = None
    id_grupo: Optional[int] = None
    id_ciclo: Optional[int] = None
    id_usuario: Optional[int] = None


class EstudianteRead(SQLModel):
    """DTO para leer un estudiante"""
    matricula: str
    nombre: str
    apellido: str
    correo: Optional[str]
    id_grupo: Optional[int]
    id_ciclo: Optional[int]
    id_usuario: Optional[int]


class EstudianteUpdate(SQLModel):
    """DTO para actualizar un estudiante"""
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    correo: Optional[str] = None
    id_grupo: Optional[int] = None
    id_ciclo: Optional[int] = None
    id_usuario: Optional[int] = None


class EstudianteBulkMoveGrupo(SQLModel):
    """DTO para mover múltiples estudiantes a un grupo"""
    matriculas: List[str]
    nuevo_id_grupo: int
