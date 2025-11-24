# app/api/v1/auth_routes.py
from datetime import timedelta
from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from fastapi import APIRouter, Depends, HTTPException, status
from app.db.database import get_session
# Importamos el modelo que SÍ tiene los permisos
from app.models import Token, UserRead, Usuario, UserReadWithPermissions
from app.core.security import (
    create_access_token, 
    verify_password
)
from app.core.permissions import get_current_user  # ¡IMPORTAR DESDE PERMISSIONS!
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(
    tags=["Autenticación"] # Grupo para la documentación
)

def authenticate_user(username: str, password: str, session: Session) -> Usuario | bool:
    """
    Busca al usuario y verifica su contraseña.
    Retorna el objeto Usuario si es exitoso, o False si falla.
    """
    user = session.exec(select(Usuario).where(Usuario.username == username)).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

@router.post("/login", response_model=Token)
async def login_for_access_token(
    # OAuth2PasswordRequestForm espera un form con "username" y "password"
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Session = Depends(get_session)
):
    """
    Endpoint principal de Login.
    Recibe username y password, devuelve un token de acceso.
    """
    user = authenticate_user(form_data.username, form_data.password, session=session)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Creamos el token con el "username" como sujeto ("sub")
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


# Cambiamos el response_model al que incluye los permisos
@router.get("/users/me", response_model=UserReadWithPermissions) ### <-- 2. CAMBIAR MODELO DE RESPUESTA
async def read_users_me(
    # Esta dependencia protege el endpoint:
    # 1. Exige un token en el header
    # 2. Valida el token
    # 3. Retorna el objeto 'Usuario' de la DB
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """
    Endpoint protegido. 
    Solo puedes acceder si envías un Token válido.
    Retorna la información del usuario logueado (incluyendo rol y permisos).
    """
    # No necesitas cambiar nada aquí. 
    # FastAPI usará el response_model para filtrar el objeto 
    # 'current_user' y devolver solo los campos de UserReadWithPermissions.
    return current_user