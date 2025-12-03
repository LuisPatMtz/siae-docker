# app/api/v1/auth_routes.py
from datetime import timedelta
from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select, func
from fastapi import APIRouter, Depends, HTTPException, status, Form
from app.db.database import get_session
# Importamos el modelo que SÍ tiene los permisos
from app.models import Token, UserRead, Usuario, UserReadWithPermissions, CicloEscolar, Grupo, Estudiante
from app.core.security import (
    create_access_token, 
    verify_password,
    get_password_hash
)
from app.core.permissions import get_current_user  # ¡IMPORTAR DESDE PERMISSIONS!
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(
    prefix="/auth",
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


@router.get("/check-system")
def check_system_status(session: Session = Depends(get_session)):
    """
    Verifica el estado del sistema:
    - Si hay usuarios en la BD
    - Si hay ciclos escolares
    - Si hay grupos
    - Si hay estudiantes
    """
    
    # Contar usuarios
    usuarios_count = session.exec(select(func.count(Usuario.id))).first()
    has_users = usuarios_count > 0
    
    if not has_users:
        return {
            "has_users": False,
            "has_cycles": False,
            "has_groups": False,
            "has_students": False,
            "needs_setup": True
        }
    
    # Contar ciclos
    ciclos_count = session.exec(select(func.count(CicloEscolar.id))).first()
    has_cycles = ciclos_count > 0
    
    # Contar grupos
    grupos_count = session.exec(select(func.count(Grupo.id))).first()
    has_groups = grupos_count > 0
    
    # Contar estudiantes
    estudiantes_count = session.exec(select(func.count(Estudiante.matricula))).first()
    has_students = estudiantes_count > 0
    
    return {
        "has_users": has_users,
        "has_cycles": has_cycles,
        "has_groups": has_groups,
        "has_students": has_students,
        "needs_setup": False
    }


@router.post("/first-setup")
def first_setup(
    full_name: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    session: Session = Depends(get_session)
):
    """
    Crea el primer usuario administrador del sistema.
    Solo funciona si no hay usuarios en la BD.
    """
    
    # Verificar que NO haya usuarios
    usuarios_count = session.exec(select(func.count(Usuario.id))).first()
    if usuarios_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El sistema ya tiene usuarios registrados"
        )
    
    # Validar datos
    if len(full_name.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre completo debe tener al menos 3 caracteres"
        )
    
    if len(username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario debe tener al menos 3 caracteres"
        )
    
    if len(password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 6 caracteres"
        )
    
    # Crear usuario administrador
    usuario = Usuario(
        username=username,
        full_name=full_name.strip(),
        hashed_password=get_password_hash(password),
        role="Administrador",
        permissions={
            "canViewDashboard": True,
            "canManageAlerts": True,
            "canEditStudents": True,
            "canManageUsers": True,
            "canManageGroups": True,
            "canManageAttendance": True,
            "canManageCycles": True,
            "canViewReports": True,
            "canExportData": True,
            "canManageNFC": True,
            "canManageMaintenance": True
        }
    )
    
    session.add(usuario)
    session.commit()
    session.refresh(usuario)
    
    return {
        "message": "Usuario administrador creado exitosamente",
        "user": {
            "id": usuario.id,
            "username": usuario.username,
            "role": usuario.role
        }
    }