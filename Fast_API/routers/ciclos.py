# app/routers/ciclos.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from database import get_session
from models import (
    CicloEscolar, 
    CicloEscolarCreate, 
    CicloEscolarRead, 
    CicloEscolarUpdate
)
from security import get_current_user

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
    # Verificar si el nombre del ciclo ya existe
    db_ciclo_existente = session.exec(
        select(CicloEscolar).where(CicloEscolar.nombre == ciclo.nombre)
    ).first()
    
    if db_ciclo_existente:
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
    
    # Si se va a crear como activo, desactivar los demás
    if ciclo.activo:
        session.exec(
            select(CicloEscolar).where(CicloEscolar.activo == True)
        )
        ciclos_activos = session.exec(
            select(CicloEscolar).where(CicloEscolar.activo == True)
        ).all()
        for ciclo_activo in ciclos_activos:
            ciclo_activo.activo = False
            session.add(ciclo_activo)
    
    db_ciclo = CicloEscolar.model_validate(ciclo)
    session.add(db_ciclo)
    session.commit()
    session.refresh(db_ciclo)
    
    # Si el ciclo se creó como activo, actualizar todos los estudiantes
    if db_ciclo.activo:
        from models import Estudiante
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
    statement = select(CicloEscolar)
    
    if activo_solo:
        statement = statement.where(CicloEscolar.activo == True)
    
    statement = statement.order_by(CicloEscolar.fecha_inicio.desc())
    ciclos = session.exec(statement).all()
    return ciclos

@router.get("/activo", response_model=CicloEscolarRead)
def get_ciclo_activo(
    *,
    session: Session = Depends(get_session)
):
    """
    Obtiene el ciclo escolar activo.
    """
    ciclo_activo = session.exec(
        select(CicloEscolar).where(CicloEscolar.activo == True)
    ).first()
    
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
    db_ciclo = session.get(CicloEscolar, id_ciclo)
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
    db_ciclo = session.get(CicloEscolar, id_ciclo)
    if not db_ciclo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ciclo escolar con ID {id_ciclo} no encontrado."
        )
    
    # Verificar que el nuevo nombre no exista (si se está cambiando)
    if ciclo_update.nombre and ciclo_update.nombre != db_ciclo.nombre:
        ciclo_existente = session.exec(
            select(CicloEscolar).where(CicloEscolar.nombre == ciclo_update.nombre)
        ).first()
        if ciclo_existente:
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
    
    # Si se va a activar este ciclo, desactivar los demás
    if ciclo_update.activo and not db_ciclo.activo:
        ciclos_activos = session.exec(
            select(CicloEscolar).where(CicloEscolar.activo == True)
        ).all()
        for ciclo_activo in ciclos_activos:
            ciclo_activo.activo = False
            session.add(ciclo_activo)
        
        # Actualizar todos los estudiantes al nuevo ciclo activo
        from models import Estudiante
        estudiantes = session.exec(select(Estudiante)).all()
        for estudiante in estudiantes:
            estudiante.id_ciclo = id_ciclo
            session.add(estudiante)
    
    # Actualizar los campos que no son None
    update_data = ciclo_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_ciclo, field, value)
    
    session.add(db_ciclo)
    session.commit()
    session.refresh(db_ciclo)
    
    return db_ciclo

@router.delete("/{id_ciclo}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ciclo_escolar(
    *,
    session: Session = Depends(get_session),
    id_ciclo: int
):
    """
    Elimina un ciclo escolar.
    """
    db_ciclo = session.get(CicloEscolar, id_ciclo)
    if not db_ciclo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ciclo escolar con ID {id_ciclo} no encontrado."
        )
    
    # Verificar que no hay estudiantes asignados a este ciclo
    from Fast_API.models import Estudiante
    estudiantes_en_ciclo = session.exec(
        select(Estudiante).where(Estudiante.id_ciclo == id_ciclo)
    ).first()
    
    if estudiantes_en_ciclo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar el ciclo porque tiene estudiantes asignados."
        )
    
    session.delete(db_ciclo)
    session.commit()
    
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
    db_ciclo = session.get(CicloEscolar, id_ciclo)
    if not db_ciclo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ciclo escolar con ID {id_ciclo} no encontrado."
        )
    
    # Desactivar todos los ciclos
    ciclos_activos = session.exec(
        select(CicloEscolar).where(CicloEscolar.activo == True)
    ).all()
    for ciclo_activo in ciclos_activos:
        ciclo_activo.activo = False
        session.add(ciclo_activo)
    
    # Activar el ciclo seleccionado
    db_ciclo.activo = True
    session.add(db_ciclo)
    
    # Actualizar todos los estudiantes al nuevo ciclo activo
    from models import Estudiante
    estudiantes = session.exec(select(Estudiante)).all()
    for estudiante in estudiantes:
        estudiante.id_ciclo = id_ciclo
        session.add(estudiante)
    
    session.commit()
    session.refresh(db_ciclo)
    
    return db_ciclo