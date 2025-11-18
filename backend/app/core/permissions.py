# app/core/permissions.py
"""
Sistema de permisos y control de acceso.
Proporciona decoradores y dependencies para validar permisos de usuarios.
"""
from typing import Callable
from functools import wraps

from fastapi import Depends, HTTPException, status
from sqlmodel import Session, select

from app.db.database import get_session
from app.core.security import get_current_username
from app.models import Usuario


def get_current_user(
    username: str = Depends(get_current_username),
    session: Session = Depends(get_session)
) -> Usuario:
    """
    Obtiene el usuario actual completo desde la base de datos.
    
    Args:
        username: Username extraído del token JWT
        session: Sesión de base de datos
        
    Returns:
        Usuario: Objeto usuario completo
        
    Raises:
        HTTPException: Si el usuario no existe en la base de datos
    """
    db_user = session.exec(
        select(Usuario).where(Usuario.username == username)
    ).first()
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado en el sistema"
        )
    
    return db_user


def require_permission(permission_key: str):
    """
    Decorador para requerir un permiso específico.
    
    Uso:
        @router.get("/users")
        @require_permission("canManageUsers")
        def get_users(...):
            ...
    
    Args:
        permission_key: Clave del permiso a verificar (ej: "canManageUsers")
        
    Returns:
        Dependency que valida el permiso
    """
    def permission_dependency(current_user: Usuario = Depends(get_current_user)):
        """Valida que el usuario tenga el permiso requerido"""
        # Los admins tienen todos los permisos
        if current_user.role == "admin":
            return current_user
        
        # Verificar el permiso específico
        if not current_user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tienes permiso para realizar esta acción. Se requiere: {permission_key}"
            )
        
        # Los permisos están almacenados como dict
        has_permission = current_user.permissions.get(permission_key, False)
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tienes permiso para realizar esta acción. Se requiere: {permission_key}"
            )
        
        return current_user
    
    return permission_dependency


def require_any_permission(*permission_keys: str):
    """
    Decorador para requerir al menos uno de varios permisos.
    
    Uso:
        @require_any_permission("canManageUsers", "canViewUsers")
        def get_users(...):
            ...
    
    Args:
        permission_keys: Claves de permisos (al menos uno debe estar presente)
        
    Returns:
        Dependency que valida los permisos
    """
    def permission_dependency(current_user: Usuario = Depends(get_current_user)):
        """Valida que el usuario tenga al menos uno de los permisos"""
        # Los admins tienen todos los permisos
        if current_user.role == "admin":
            return current_user
        
        if not current_user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tienes permiso para realizar esta acción. Se requiere uno de: {', '.join(permission_keys)}"
            )
        
        # Verificar si tiene al menos uno de los permisos
        has_any_permission = any(
            current_user.permissions.get(key, False) 
            for key in permission_keys
        )
        
        if not has_any_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tienes permiso para realizar esta acción. Se requiere uno de: {', '.join(permission_keys)}"
            )
        
        return current_user
    
    return permission_dependency


def require_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """
    Dependency que requiere que el usuario sea administrador.
    
    Args:
        current_user: Usuario actual
        
    Returns:
        Usuario: El usuario actual si es admin
        
    Raises:
        HTTPException: Si el usuario no es administrador
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta acción requiere permisos de administrador"
        )
    
    return current_user


# Lista de permisos disponibles en el sistema (documentación)
AVAILABLE_PERMISSIONS = {
    # Usuarios
    "canManageUsers": "Puede crear, editar y eliminar usuarios",
    "canViewUsers": "Puede ver la lista de usuarios",
    "canEditPermissions": "Puede modificar permisos de otros usuarios",
    
    # Estudiantes
    "canManageStudents": "Puede crear, editar y eliminar estudiantes",
    "canViewStudents": "Puede ver la lista de estudiantes",
    "canUploadStudents": "Puede cargar estudiantes desde CSV",
    
    # Grupos
    "canManageGroups": "Puede crear, editar y eliminar grupos",
    "canViewGroups": "Puede ver la lista de grupos",
    
    # Ciclos Escolares
    "canManageCycles": "Puede crear, editar y eliminar ciclos escolares",
    "canViewCycles": "Puede ver la lista de ciclos escolares",
    "canActivateCycle": "Puede activar/desactivar ciclos escolares",
    
    # Tarjetas NFC
    "canManageNFC": "Puede vincular y desvincular tarjetas NFC",
    "canViewNFC": "Puede ver tarjetas NFC vinculadas",
    
    # Accesos
    "canRegisterAccess": "Puede registrar accesos manualmente",
    "canViewAccess": "Puede ver historial de accesos",
    
    # Faltas
    "canManageAbsences": "Puede registrar y eliminar faltas",
    "canJustifyAbsences": "Puede justificar faltas",
    "canViewAbsences": "Puede ver faltas registradas",
    
    # Dashboard
    "canViewDashboard": "Puede ver estadísticas y dashboard",
    "canViewReports": "Puede generar reportes"
}
