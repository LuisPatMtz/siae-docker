# app/api/v1/justificaciones_routes.py
"""
Rutas de la API para gestionar justificaciones de faltas (uso interno).
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.db.database import get_session
from app.models.justificacion import Justificacion, JustificacionCreate, JustificacionRead
from app.repositories.justificacion_repo import JustificacionRepository
from app.services.justificacion_service import JustificacionService

router = APIRouter(prefix="/justificaciones", tags=["Justificaciones"])


def get_justificacion_service(session: Session = Depends(get_session)) -> JustificacionService:
    """Dependency para obtener el servicio de justificaciones"""
    justificacion_repo = JustificacionRepository(session)
    return JustificacionService(justificacion_repo)


@router.post("/", response_model=JustificacionRead, status_code=status.HTTP_201_CREATED)
def crear_justificacion(
    *,
    service: JustificacionService = Depends(get_justificacion_service),
    justificacion_data: JustificacionCreate
):
    """
    Crea una nueva justificación.
    Esta justificación puede ser vinculada a múltiples faltas.
    """
    try:
        justificacion = service.crear_justificacion(justificacion_data)
        return justificacion
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/", response_model=List[JustificacionRead])
def obtener_todas_justificaciones(
    *,
    service: JustificacionService = Depends(get_justificacion_service)
):
    """
    Obtiene todas las justificaciones del sistema.
    """
    return service.obtener_todas_justificaciones()


@router.get("/{id_justificacion}", response_model=JustificacionRead)
def obtener_justificacion(
    *,
    id_justificacion: int,
    service: JustificacionService = Depends(get_justificacion_service)
):
    """
    Obtiene una justificación específica por ID.
    """
    try:
        return service.obtener_justificacion(id_justificacion)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{id_justificacion}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_justificacion(
    *,
    id_justificacion: int,
    service: JustificacionService = Depends(get_justificacion_service)
):
    """
    Elimina una justificación.
    """
    success = service.eliminar_justificacion(id_justificacion)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Justificación con ID {id_justificacion} no encontrada"
        )
