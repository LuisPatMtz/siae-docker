# app/models/auth.py
"""
Modelos de autenticación y DTOs de usuarios.
"""
from typing import Optional
from sqlmodel import SQLModel, Field

# --- Schema para el objeto JSON de Permisos ---

class UserPermissionData(SQLModel):
    """Esquema de permisos de usuario"""
    canViewDashboard: bool = Field(default=False)
    canManageAlerts: bool = Field(default=False)
    canEditStudents: bool = Field(default=False)
    canManageUsers: bool = Field(default=False)
    canManageMaintenance: bool = Field(default=False)
    canManageAttendance: bool = Field(default=False)


# --- DTOs para Autenticación (Login) ---

class UserRead(SQLModel):
    """DTO para leer información básica de usuario"""
    id: int
    username: str
    full_name: Optional[str] = None
    role: str


class Token(SQLModel):
    """DTO para respuesta de login con token"""
    access_token: str
    token_type: str


class TokenData(SQLModel):
    """DTO para datos decodificados del token"""
    username: Optional[str] = None


# --- DTOs para Gestión de Usuarios (Admin) ---

class UserReadWithPermissions(SQLModel):
    """DTO para leer un usuario con sus permisos"""
    id: int
    username: str
    full_name: Optional[str] = None
    role: str
    permissions: UserPermissionData


class AdminUserCreate(SQLModel):
    """DTO para crear un usuario desde el panel de admin"""
    username: str
    password: str
    full_name: Optional[str] = None
    role: str
    permissions: UserPermissionData


class UserPermissionsUpdate(SQLModel):
    """DTO para actualizar solo los permisos"""
    permissions: UserPermissionData


class UserUpdate(SQLModel):
    """DTO para actualizar usuario"""
    username: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    permissions: Optional[UserPermissionData] = None
