# app/routers/users.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from database import get_session
from security import get_current_user, get_password_hash
from models import (
    Usuario,
    UserRead,
    UserReadWithPermissions,
    AdminUserCreate,
    UserPermissionsUpdate,
    UserUpdate
)

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
    statement = select(Usuario).order_by(Usuario.username)
    users = session.exec(statement).all()
    return users

@router.get("/{user_id}", response_model=UserReadWithPermissions)
def get_user_by_id(
    *,
    session: Session = Depends(get_session),
    user_id: int
):
    """
    Obtiene un usuario específico por su ID.
    """
    db_user = session.get(Usuario, user_id)
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
    # Verificar si el username ya existe
    db_user = session.exec(select(Usuario).where(Usuario.username == user_in.username)).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este nombre de usuario ya está registrado."
        )
    
    # Hashear la contraseña antes de guardarla
    hashed_password = get_password_hash(user_in.password)
    
    # Crear el objeto de DB
    db_user = Usuario(
        username=user_in.username,
        role=user_in.role,
        permissions=user_in.permissions.model_dump(),
        hashed_password=hashed_password
    )
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    return db_user

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
    db_user = session.get(Usuario, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar que el nuevo username no exista (si se está cambiando)
    if user_update.username and user_update.username != db_user.username:
        usuario_existente = session.exec(
            select(Usuario).where(Usuario.username == user_update.username)
        ).first()
        if usuario_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este nombre de usuario ya está registrado."
            )
    
    # Actualizar los campos que no son None
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "permissions" and value is not None:
            setattr(db_user, field, value.model_dump())
        else:
            setattr(db_user, field, value)
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    return db_user

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
    db_user = session.get(Usuario, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    # Actualiza el campo de permisos
    db_user.permissions = permissions_in.permissions.model_dump()
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
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

    db_user = session.get(Usuario, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    session.delete(db_user)
    session.commit()
    
    return None