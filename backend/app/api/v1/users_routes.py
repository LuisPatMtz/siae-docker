# app/api/v1/users.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.db.database import get_session
from app.core.permissions import get_current_user, require_permission
from app.core.logging import log_action
from app.models import (
    Usuario,
    UserRead,
    UserReadWithPermissions,
    AdminUserCreate,
    UserPermissionsUpdate,
    UserUpdate
)
from app.repositories.usuario_repo import UsuarioRepository

router = APIRouter(
    prefix="/users",
    tags=["Usuarios"],
    dependencies=[Depends(get_current_user)] 
)

@router.get("/me", response_model=UserRead)
async def read_users_me(current_user: Usuario = Depends(get_current_user)):
    """
    Obtiene los datos del usuario actualmente autenticado.
    """
    return current_user

@router.get("", response_model=List[UserReadWithPermissions])
def get_all_users(
    *,
    session: Session = Depends(get_session)
):
    """
    Obtiene una lista de todos los usuarios y sus permisos.
    """
    repo = UsuarioRepository(session)
    return repo.get_all()

@router.get("/{user_id}", response_model=UserReadWithPermissions)
def get_user_by_id(
    *,
    session: Session = Depends(get_session),
    user_id: int
):
    """
    Obtiene un usuario específico por su ID.
    """
    repo = UsuarioRepository(session)
    db_user = repo.get_by_id(user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return db_user

@router.post("", response_model=UserReadWithPermissions, status_code=status.HTTP_201_CREATED)
def create_user(
    *,
    session: Session = Depends(get_session),
    user_in: AdminUserCreate
):
    """
    Crea un nuevo usuario (desde el panel de admin).
    """
    repo = UsuarioRepository(session)
    
    # Verificar si el username ya existe
    if repo.get_by_username(user_in.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este nombre de usuario ya está registrado."
        )
    
    return repo.create(user_in)

@router.put("/{user_id}", response_model=UserReadWithPermissions)
def update_user(
    *,
    session: Session = Depends(get_session),
    user_id: int,
    user_update: UserUpdate
):
    """
    Actualiza un usuario existente.
    """
    repo = UsuarioRepository(session)
    db_user = repo.get_by_id(user_id)
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar que el nuevo username no exista (si se está cambiando)
    if user_update.username and user_update.username != db_user.username:
        if repo.get_by_username(user_update.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este nombre de usuario ya está registrado."
            )
    
    updated_user = repo.update(user_id, user_update)
    return updated_user

@router.patch("/{user_id}/permissions", response_model=UserReadWithPermissions)
def update_user_permissions(
    *,
    session: Session = Depends(get_session),
    user_id: int,
    permissions_in: UserPermissionsUpdate
):
    """
    Actualiza únicamente los permisos de un usuario específico.
    """
    repo = UsuarioRepository(session)
    db_user = repo.update_permissions(user_id, permissions_in)
    
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return db_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    *,
    session: Session = Depends(get_session),
    user_id: int,
    current_user: Usuario = Depends(get_current_user)
):
    """
    Elimina un usuario.
    """
    # ¡Importante! No permitas que un usuario se borre a sí mismo.
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propia cuenta."
        )

    repo = UsuarioRepository(session)
    if not repo.delete(user_id):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return None