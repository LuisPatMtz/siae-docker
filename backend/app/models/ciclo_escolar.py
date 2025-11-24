# app/models/ciclo_escolar.py
"""
Modelo de Ciclo Escolar: periodos académicos.
"""
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.estudiante import Estudiante
    from app.models.acceso import Acceso
    from app.models.falta import Falta
from typing import Optional, List
from datetime import date
from sqlmodel import Field, SQLModel, Relationship

class CicloEscolar(SQLModel, table=True):
    """Tabla de ciclos escolares"""
    __tablename__ = "ciclo_escolar"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100, unique=True)
    fecha_inicio: date
    fecha_fin: date
    activo: bool = Field(default=False)
    
    # Relaciones con cascade (SET NULL para estudiantes, DELETE para accesos/faltas)
    estudiantes: List["Estudiante"] = Relationship(back_populates="ciclo")  # noqa: F821
    accesos: List["Acceso"] = Relationship(  # noqa: F821
        back_populates="ciclo",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    faltas: List["Falta"] = Relationship(  # noqa: F821
        back_populates="ciclo",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


# --- DTOs ---

class CicloEscolarCreate(SQLModel):
    """DTO para crear un ciclo escolar"""
    nombre: str
    fecha_inicio: date
    fecha_fin: date
    activo: bool = False


class CicloEscolarRead(SQLModel):
    """DTO para leer un ciclo escolar"""
    id: int
    nombre: str
    fecha_inicio: date
    fecha_fin: date
    activo: bool


class CicloEscolarUpdate(SQLModel):
    """DTO para actualizar un ciclo escolar"""
    nombre: Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    activo: Optional[bool] = None
