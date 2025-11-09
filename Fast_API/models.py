# app/models.py
from typing import Dict, Optional, List, Any
from datetime import datetime, date, time
from pydantic import conint
# Importaciones de SQLModel y SQLAlchemy
from sqlmodel import Field, Session, SQLModel, Relationship, UniqueConstraint, func, JSON, Column

# --- 1. MODELOS DE TABLAS (Base de Datos) ---

# 1. Tabla de Catálogo: Ciclo_Escolar
class CicloEscolar(SQLModel, table=True):
    __tablename__ = "ciclo_escolar"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100, unique=True)
    fecha_inicio: date
    fecha_fin: date
    activo: bool = Field(default=False)
    
    # Relaciones
    estudiantes: List["Estudiante"] = Relationship(back_populates="ciclo")
    accesos: List["Acceso"] = Relationship(back_populates="ciclo")
    faltas: List["Falta"] = Relationship(back_populates="ciclo")

# 2. Tabla de Catálogo: Grupo
class Grupo(SQLModel, table=True):
    __tablename__ = "grupo"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=50, unique=True)
    turno: Optional[str] = Field(max_length=50, default=None)
    semestre: int = Field(ge=1, le=6, index=True)
    
    # Relaciones
    estudiantes: List["Estudiante"] = Relationship(back_populates="grupo")

# 3. Tabla de Administración: Usuarios
class Usuario(SQLModel, table=True):
    __tablename__ = "usuarios"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(max_length=50, unique=True)
    hashed_password: str
    role: str = Field(default="Usuario", max_length=50)
    permissions: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))

# 4. Tabla Principal: Estudiante
class Estudiante(SQLModel, table=True):
    __tablename__ = "estudiante"
    
    matricula: str = Field(primary_key=True, max_length=30)
    nombre: str = Field(max_length=100)
    apellido: str = Field(max_length=100)
    correo: Optional[str] = Field(max_length=100, unique=True, default=None)
    id_grupo: Optional[int] = Field(default=None, foreign_key="grupo.id")
    id_ciclo: Optional[int] = Field(default=None, foreign_key="ciclo_escolar.id")
    
    # Relaciones
    grupo: Optional[Grupo] = Relationship(back_populates="estudiantes")
    ciclo: Optional[CicloEscolar] = Relationship(back_populates="estudiantes")
    nfc: Optional["NFC"] = Relationship(back_populates="estudiante")
    faltas: List["Falta"] = Relationship(back_populates="estudiante")

# 5. Tabla de Asignación: NFC
class NFC(SQLModel, table=True):
    __tablename__ = "nfc"
    
    nfc_uid: str = Field(primary_key=True, max_length=50)
    matricula_estudiante: str = Field(foreign_key="estudiante.matricula", unique=True)
    
    # Relaciones
    estudiante: Estudiante = Relationship(back_populates="nfc")
    accesos: List["Acceso"] = Relationship(back_populates="nfc")

# 6. Tabla de Registros: Accesos
class Acceso(SQLModel, table=True):
    __tablename__ = "accesos"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nfc_uid: str = Field(foreign_key="nfc.nfc_uid")
    id_ciclo: int = Field(foreign_key="ciclo_escolar.id")
    hora_registro: datetime = Field(default_factory=datetime.utcnow)
    
    # Relaciones
    nfc: NFC = Relationship(back_populates="accesos")
    ciclo: CicloEscolar = Relationship(back_populates="accesos")

# 7. Tabla de Seguimiento: Faltas
class Falta(SQLModel, table=True):
    __tablename__ = "faltas"
    
    __table_args__ = (UniqueConstraint("matricula_estudiante", "fecha", name="unique_student_date"),)
    
    id: Optional[int] = Field(default=None, primary_key=True)
    matricula_estudiante: str = Field(foreign_key="estudiante.matricula")
    id_ciclo: int = Field(foreign_key="ciclo_escolar.id")
    fecha: date
    estado: str = Field(default="Ausente", max_length=50)
    justificacion: Optional[str] = Field(default=None)
    
    # Relaciones
    estudiante: Estudiante = Relationship(back_populates="faltas")
    ciclo: CicloEscolar = Relationship(back_populates="faltas")

# --- 2. MODELOS DE API (DTOs - Data Transfer Objects) ---

# --- DTOs para Ciclo Escolar ---
class CicloEscolarCreate(SQLModel):
    nombre: str
    fecha_inicio: date
    fecha_fin: date
    activo: bool = False

class CicloEscolarRead(SQLModel):
    id: int
    nombre: str
    fecha_inicio: date
    fecha_fin: date
    activo: bool

class CicloEscolarUpdate(SQLModel):
    nombre: Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    activo: Optional[bool] = None

# --- DTOs para Grupo ---
class GrupoCreate(SQLModel):
    nombre: str
    turno: Optional[str] = None
    semestre: int = Field(ge=1, le=6)

class GrupoRead(SQLModel):
    id: int
    nombre: str
    turno: Optional[str]
    semestre: int

class GrupoUpdate(SQLModel):
    nombre: Optional[str] = None
    turno: Optional[str] = None
    semestre: Optional[int] = Field(default=None, ge=1, le=6)

# --- DTOs para Estudiante ---
class EstudianteCreate(SQLModel):
    matricula: str
    nombre: str
    apellido: str
    correo: Optional[str] = None
    id_grupo: Optional[int] = None
    id_ciclo: Optional[int] = None

class EstudianteRead(SQLModel):
    matricula: str
    nombre: str
    apellido: str
    correo: Optional[str]
    id_grupo: Optional[int]
    id_ciclo: Optional[int]

class EstudianteUpdate(SQLModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    correo: Optional[str] = None
    id_grupo: Optional[int] = None
    id_ciclo: Optional[int] = None

# --- DTOs para NFC ---
class NFCCreate(SQLModel):
    nfc_uid: str
    matricula_estudiante: str

class NFCRead(SQLModel):
    nfc_uid: str
    matricula_estudiante: str

# DTO para el endpoint de /acceso
class NfcPayload(SQLModel):
    nfc_uid: str

# --- DTOs para Acceso ---
class AccesoCreate(SQLModel):
    nfc_uid: str
    id_ciclo: int

class AccesoRead(SQLModel):
    id: int
    nfc_uid: str
    id_ciclo: int
    hora_registro: datetime

# --- DTOs para Faltas ---
class FaltaCreate(SQLModel):
    matricula_estudiante: str
    id_ciclo: int
    fecha: date
    estado: str = "Ausente"
    justificacion: Optional[str] = None

class FaltaRead(SQLModel):
    id: int
    matricula_estudiante: str
    id_ciclo: int
    fecha: date
    estado: str
    justificacion: Optional[str]

class FaltaUpdate(SQLModel):
    estado: Optional[str] = None
    justificacion: Optional[str] = None

# --- DTOs para Dashboard y Estadísticas ---
class StatsData(SQLModel):
    totalStudents: int
    averageAttendance: float

class TurnoDataResponse(SQLModel):
    stats: StatsData
    groups: Dict[str, List[str]]

class GrupoAsistenciaResponse(SQLModel):
    totalStudents: int
    attendance: Dict[str, float]

# DTO para la pág. de Gestión de Estudiantes (incluye relaciones)
class EstudianteReadComplete(EstudianteRead):
    grupo: Optional[GrupoRead] = None
    ciclo: Optional[CicloEscolarRead] = None
    nfc: Optional[NFCRead] = None


# --- 3. MODELOS DE AUTENTICACIÓN Y USUARIOS ---

# --- 3A. Schema para el objeto JSON de Permisos ---
class UserPermissionData(SQLModel):
    canViewDashboard: bool = Field(default=False)
    canManageAlerts: bool = Field(default=False)
    canEditStudents: bool = Field(default=False)
    canManageUsers: bool = Field(default=False)

# --- 3B. DTOs para Autenticación (Login) ---
class UserRead(SQLModel):
    id: int
    username: str
    role: str

class Token(SQLModel):
    access_token: str
    token_type: str

class TokenData(SQLModel):
    username: Optional[str] = None

# --- 3C. DTOs para Gestión de Usuarios (Admin) ---

# DTO para leer un usuario con sus permisos (para las tarjetas)
class UserReadWithPermissions(SQLModel):
    id: int
    username: str
    role: str
    permissions: UserPermissionData

# DTO para crear un usuario desde el panel de admin
class AdminUserCreate(SQLModel):
    username: str
    password: str
    role: str
    permissions: UserPermissionData

# DTO para actualizar solo los permisos
class UserPermissionsUpdate(SQLModel):
    permissions: UserPermissionData

# DTO para actualizar usuario
class UserUpdate(SQLModel):
    username: Optional[str] = None
    role: Optional[str] = None
    permissions: Optional[UserPermissionData] = None