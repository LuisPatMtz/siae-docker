# app/routers/grupos.py (Versión Mejorada)

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError

from database import get_session
from models import (
    Grupo, 
    GrupoCreate, 
    GrupoRead, 
    GrupoUpdate,
    Estudiante # Importar Estudiante aquí para la verificación
)
from security import get_current_user

# --- Dependencia Reutilizable ---

def get_grupo_or_404_dep(
    id_grupo: int, 
    session: Session = Depends(get_session)
) -> Grupo:
    """
    Dependencia que obtiene un Grupo por ID o lanza HTTPException 404.
    """
    db_grupo = session.get(Grupo, id_grupo)
    if not db_grupo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grupo con ID {id_grupo} no encontrado."
        )
    return db_grupo

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
    db_grupo = Grupo.model_validate(grupo)
    session.add(db_grupo)
    
    try:
        session.commit()
        session.refresh(db_grupo)
        return db_grupo
    except IntegrityError:
        # Falla si la restricción UNIQUE en la DB es violada
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
    statement = select(Grupo).order_by(Grupo.nombre)
    grupos = session.exec(statement).all()
    return grupos

@router.get("/{id_grupo}", response_model=GrupoRead)
def get_grupo_por_id(
    *,
    db_grupo: Grupo = Depends(get_grupo_or_404_dep)
):
    """
    Obtiene un grupo específico por su ID usando la dependencia.
    """
    return db_grupo

@router.put("/{id_grupo}", response_model=GrupoRead)
def update_grupo(
    *,
    session: Session = Depends(get_session),
    db_grupo: Grupo = Depends(get_grupo_or_404_dep),
    grupo_update: GrupoUpdate
):
    """
    Actualiza un grupo existente.
    """
    # La validación 404 ya fue hecha por la dependencia.
    
    update_data = grupo_update.model_dump(exclude_unset=True)
    
    # Validar unicidad del nombre si está cambiando
    if "nombre" in update_data and update_data["nombre"] != db_grupo.nombre:
        grupo_existente = session.exec(
            select(Grupo).where(Grupo.nombre == update_data["nombre"])
        ).first()
        if grupo_existente:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El grupo '{update_data['nombre']}' ya existe."
            )

    for field, value in update_data.items():
        setattr(db_grupo, field, value)
    
    session.add(db_grupo)
    try:
        session.commit()
        session.refresh(db_grupo)
        return db_grupo
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
    db_grupo: Grupo = Depends(get_grupo_or_404_dep)
):
    """
    Elimina un grupo, verificando dependencias (estudiantes).
    """
    # La validación 404 ya fue hecha por la dependencia.
    
    # Verificar que no hay estudiantes asignados a este grupo
    estudiantes_en_grupo = session.exec(
        select(Estudiante).where(Estudiante.id_grupo == db_grupo.id)
    ).first()
    
    if estudiantes_en_grupo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar el grupo porque tiene estudiantes asignados."
        )
    
    session.delete(db_grupo)
    try:
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al eliminar el grupo: {str(e)}"
        )
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)