"""
API endpoints para configuración del sistema.
Permite consultar y actualizar parámetros configurables del sistema.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.permissions import get_current_user
from app.db.database import get_session
from app.models.system_config import SystemConfig, SystemConfigRead, SystemConfigUpdate
from app.models.usuario import Usuario

router = APIRouter(prefix="/system-config", tags=["system-config"])


@router.get("/", response_model=List[SystemConfigRead])
def get_all_configs(
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene todas las configuraciones del sistema.
    Solo accesible para administradores.
    """
    configs = session.exec(select(SystemConfig)).all()
    return configs


@router.get("/{key}", response_model=SystemConfigRead)
def get_config_by_key(
    key: str,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene una configuración específica por su clave.
    Solo accesible para administradores.
    """
    config = session.exec(
        select(SystemConfig).where(SystemConfig.key == key)
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuración con clave '{key}' no encontrada"
        )
    
    return config


@router.put("/{key}", response_model=SystemConfigRead)
def update_config(
    key: str,
    config_update: SystemConfigUpdate,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Actualiza el valor de una configuración existente.
    Solo accesible para administradores.
    """
    config = session.exec(
        select(SystemConfig).where(SystemConfig.key == key)
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuración con clave '{key}' no encontrada"
        )
    
    # Actualizar solo los campos proporcionados
    update_data = config_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)
    
    session.add(config)
    session.commit()
    session.refresh(config)
    
    return config
