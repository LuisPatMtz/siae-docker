# app/api/v1/ciclos.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db.database import get_session
from app.models import (
    CicloEscolar, 
    CicloEscolarCreate, 
    CicloEscolarRead, 
    CicloEscolarUpdate
)
from app.core.permissions import get_current_user
from app.repositories.ciclo_repo import CicloRepository

router = APIRouter(
    prefix="/ciclos",
    tags=["Ciclos Escolares"],
    dependencies=[Depends(get_current_user)]
)

@router.post("", response_model=CicloEscolarRead, status_code=status.HTTP_201_CREATED)
def create_ciclo_escolar(
    *, 
    session: Session = Depends(get_session), 
    ciclo: CicloEscolarCreate
):
    """
    Crea un nuevo ciclo escolar.
    """
    repo = CicloRepository(session)
    
    # Verificar si el nombre del ciclo ya existe
    if repo.get_by_nombre(ciclo.nombre):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El ciclo escolar '{ciclo.nombre}' ya existe."
        )
    
    # Verificar fechas
    if ciclo.fecha_inicio >= ciclo.fecha_fin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha de inicio debe ser anterior a la fecha de fin."
        )
    
    db_ciclo = repo.create(ciclo)
    
    # Si el ciclo se creó como activo, actualizar todos los estudiantes
    if db_ciclo.activo:
        from app.models import Estudiante
        estudiantes = session.exec(select(Estudiante)).all()
        for estudiante in estudiantes:
            estudiante.id_ciclo = db_ciclo.id
            session.add(estudiante)
        session.commit()
        session.refresh(db_ciclo)
    
    return db_ciclo

@router.get("", response_model=List[CicloEscolarRead])
def get_todos_los_ciclos(
    *,
    session: Session = Depends(get_session),
    activo_solo: bool = False
):
    """
    Obtiene todos los ciclos escolares.
    Si activo_solo=True, solo devuelve el ciclo activo.
    """
    repo = CicloRepository(session)
    
    if activo_solo:
        ciclo = repo.get_activo()
        return [ciclo] if ciclo else []
    
    return repo.get_all()

@router.get("/activo", response_model=CicloEscolarRead)
def get_ciclo_activo(
    *,
    session: Session = Depends(get_session)
):
    """
    Obtiene el ciclo escolar activo.
    """
    repo = CicloRepository(session)
    ciclo_activo = repo.get_activo()
    
    if not ciclo_activo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay un ciclo escolar activo."
        )
    
    return ciclo_activo

@router.get("/{id_ciclo}", response_model=CicloEscolarRead)
def get_ciclo_por_id(
    *,
    session: Session = Depends(get_session),
    id_ciclo: int
):
    """
    Obtiene un ciclo escolar específico por su ID.
    """
    repo = CicloRepository(session)
    db_ciclo = repo.get_by_id(id_ciclo)
    
    if not db_ciclo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ciclo escolar con ID {id_ciclo} no encontrado."
        )
    
    return db_ciclo

@router.put("/{id_ciclo}", response_model=CicloEscolarRead)
def update_ciclo_escolar(
    *,
    session: Session = Depends(get_session),
    id_ciclo: int,
    ciclo_update: CicloEscolarUpdate
):
    """
    Actualiza un ciclo escolar existente.
    """
    repo = CicloRepository(session)
    db_ciclo = repo.get_by_id(id_ciclo)
    
    if not db_ciclo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ciclo escolar con ID {id_ciclo} no encontrado."
        )
    
    # Verificar que el nuevo nombre no exista (si se está cambiando)
    if ciclo_update.nombre and ciclo_update.nombre != db_ciclo.nombre:
        if repo.get_by_nombre(ciclo_update.nombre):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El ciclo escolar '{ciclo_update.nombre}' ya existe."
            )
    
    # Verificar fechas si se están actualizando
    fecha_inicio = ciclo_update.fecha_inicio or db_ciclo.fecha_inicio
    fecha_fin = ciclo_update.fecha_fin or db_ciclo.fecha_fin
    
    if fecha_inicio >= fecha_fin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha de inicio debe ser anterior a la fecha de fin."
        )
    
    # Si se va a activar este ciclo, actualizar estudiantes
    if ciclo_update.activo and not db_ciclo.activo:
        from app.models import Estudiante
        estudiantes = session.exec(select(Estudiante)).all()
        for estudiante in estudiantes:
            estudiante.id_ciclo = id_ciclo
            session.add(estudiante)
    
    return repo.update(id_ciclo, ciclo_update)

@router.delete("/{id_ciclo}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ciclo_escolar(
    *,
    session: Session = Depends(get_session),
    id_ciclo: int
):
    """
    Elimina un ciclo escolar.
    """
    repo = CicloRepository(session)
    
    if not repo.get_by_id(id_ciclo):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ciclo escolar con ID {id_ciclo} no encontrado."
        )
    
    # Verificar que no hay estudiantes asignados a este ciclo
    from app.models import Estudiante
    estudiantes_en_ciclo = session.exec(
        select(Estudiante).where(Estudiante.id_ciclo == id_ciclo)
    ).first()
    
    if estudiantes_en_ciclo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar el ciclo porque tiene estudiantes asignados."
        )
    
    repo.delete(id_ciclo)
    return None

@router.post("/{id_ciclo}/activar", response_model=CicloEscolarRead)
def activar_ciclo_escolar(
    *,
    session: Session = Depends(get_session),
    id_ciclo: int
):
    """
    Activa un ciclo escolar específico y desactiva todos los demás.
    Automáticamente actualiza todos los estudiantes al nuevo ciclo activo.
    """
    repo = CicloRepository(session)
    db_ciclo = repo.activar(id_ciclo)
    
    if not db_ciclo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ciclo escolar con ID {id_ciclo} no encontrado."
        )
    
    # Actualizar todos los estudiantes al nuevo ciclo activo
    from app.models import Estudiante
    estudiantes = session.exec(select(Estudiante)).all()
    for estudiante in estudiantes:
        estudiante.id_ciclo = id_ciclo
        session.add(estudiante)
    
    session.commit()
    session.refresh(db_ciclo)
    
    return db_ciclo