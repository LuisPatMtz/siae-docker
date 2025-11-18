# app/api/v1/grupos.py (Versión Mejorada)

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError

from app.db.database import get_session
from app.models import (
    Grupo, 
    GrupoCreate, 
    GrupoRead, 
    GrupoUpdate,
    Estudiante # Importar Estudiante aquí para la verificación
)
from app.core.permissions import get_current_user
from app.repositories.grupo_repo import GrupoRepository

# --- Router ---

router = APIRouter(
    prefix="/grupos",
    tags=["Grupos"],
    dependencies=[Depends(get_current_user)]
)

@router.post("", response_model=GrupoRead, status_code=status.HTTP_201_CREATED)
def create_grupo(
    *, 
    session: Session = Depends(get_session), 
    grupo: GrupoCreate
):
    """
    Crea un nuevo grupo.
    Maneja explícitamente conflictos de unicidad.
    """
    repo = GrupoRepository(session)
    
    # Verificar si ya existe
    if repo.get_by_nombre(grupo.nombre):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El grupo '{grupo.nombre}' ya existe."
        )
    
    try:
        return repo.create(grupo)
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El grupo '{grupo.nombre}' ya existe."
        )
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al crear el grupo: {str(e)}"
        )

@router.get("", response_model=List[GrupoRead])
def get_todos_los_grupos(
    *,
    session: Session = Depends(get_session)
):
    """
    Obtiene todos los grupos.
    """
    repo = GrupoRepository(session)
    return repo.get_all()

@router.get("/{id_grupo}", response_model=GrupoRead)
def get_grupo_por_id(
    *,
    session: Session = Depends(get_session),
    id_grupo: int
):
    """
    Obtiene un grupo específico por su ID.
    """
    repo = GrupoRepository(session)
@router.put("/{id_grupo}", response_model=GrupoRead)
def update_grupo(
    *,
    session: Session = Depends(get_session),
    id_grupo: int,
    grupo_update: GrupoUpdate
):
    """
    Actualiza un grupo existente.
    """
    repo = GrupoRepository(session)
    db_grupo = repo.get_by_id(id_grupo)
    
    if not db_grupo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grupo con ID {id_grupo} no encontrado."
        )
    
    # Validar unicidad del nombre si está cambiando
    update_data = grupo_update.model_dump(exclude_unset=True)
    if "nombre" in update_data and update_data["nombre"] != db_grupo.nombre:
        if repo.get_by_nombre(update_data["nombre"]):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El grupo '{update_data['nombre']}' ya existe."
            )

    try:
        return repo.update(id_grupo, grupo_update)
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflicto de integridad, es posible que el nombre ya exista."
        )
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al actualizar el grupo: {str(e)}"
        )

@router.delete("/{id_grupo}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grupo(
    *,
    session: Session = Depends(get_session),
    id_grupo: int
):
    """
    Elimina un grupo, verificando dependencias (estudiantes).
    """
    repo = GrupoRepository(session)
    
    if not repo.get_by_id(id_grupo):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grupo con ID {id_grupo} no encontrado."
        )
    
    # Verificar que no hay estudiantes asignados a este grupo
    estudiantes_en_grupo = session.exec(
        select(Estudiante).where(Estudiante.id_grupo == id_grupo)
    ).first()
    
    if estudiantes_en_grupo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar el grupo porque tiene estudiantes asignados."
        )
    
    try:
        repo.delete(id_grupo)
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al eliminar el grupo: {str(e)}"
        )
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)