# app/api/v1/faltas.py
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select

from app.db.database import get_session
from app.models import (
    Falta, 
    FaltaCreate, 
    FaltaRead, 
    FaltaUpdate,
    Estudiante,
    CicloEscolar
)
from app.core.security import get_current_user

router = APIRouter(
    prefix="/faltas",
    tags=["Faltas"],
    dependencies=[Depends(get_current_user)]
)

@router.post("", response_model=FaltaRead, status_code=status.HTTP_201_CREATED)
def create_falta(
    *, 
    session: Session = Depends(get_session), 
    falta: FaltaCreate
):
    """
    Registra una falta para un estudiante.
    """
    # Verificar que el estudiante existe
    estudiante = session.get(Estudiante, falta.matricula_estudiante)
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudiante con matrícula {falta.matricula_estudiante} no encontrado."
        )
    
    # Verificar que el ciclo existe
    ciclo = session.get(CicloEscolar, falta.id_ciclo)
    if not ciclo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ciclo escolar con ID {falta.id_ciclo} no encontrado."
        )
    
    # Verificar que no existe ya una falta para este estudiante en esta fecha
    falta_existente = session.exec(
        select(Falta).where(
            Falta.matricula_estudiante == falta.matricula_estudiante,
            Falta.fecha == falta.fecha
        )
    ).first()
    
    if falta_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un registro de falta para el estudiante {falta.matricula_estudiante} en la fecha {falta.fecha}."
        )
    
    db_falta = Falta.model_validate(falta)
    session.add(db_falta)
    session.commit()
    session.refresh(db_falta)
    
    return db_falta

@router.get("", response_model=List[FaltaRead])
def get_faltas(
    *,
    session: Session = Depends(get_session),
    matricula_estudiante: Optional[str] = Query(None),
    id_ciclo: Optional[int] = Query(None),
    fecha: Optional[date] = Query(None),
    estado: Optional[str] = Query(None)
):
    """
    Obtiene faltas con filtros opcionales.
    """
    statement = select(Falta)
    
    if matricula_estudiante:
        statement = statement.where(Falta.matricula_estudiante == matricula_estudiante)
    
    if id_ciclo:
        statement = statement.where(Falta.id_ciclo == id_ciclo)
    
    if fecha:
        statement = statement.where(Falta.fecha == fecha)
    
    if estado:
        statement = statement.where(Falta.estado == estado)
    
    statement = statement.order_by(Falta.fecha.desc())
    faltas = session.exec(statement).all()
    return faltas

@router.get("/estudiante/{matricula}", response_model=List[FaltaRead])
def get_faltas_por_estudiante(
    *,
    session: Session = Depends(get_session),
    matricula: str,
    id_ciclo: Optional[int] = Query(None)
):
    """
    Obtiene todas las faltas de un estudiante específico.
    """
    # Verificar que el estudiante existe
    estudiante = session.get(Estudiante, matricula)
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudiante con matrícula {matricula} no encontrado."
        )
    
    statement = select(Falta).where(Falta.matricula_estudiante == matricula)
    
    if id_ciclo:
        statement = statement.where(Falta.id_ciclo == id_ciclo)
    
    statement = statement.order_by(Falta.fecha.desc())
    faltas = session.exec(statement).all()
    return faltas

@router.get("/fecha/{fecha}", response_model=List[FaltaRead])
def get_faltas_por_fecha(
    *,
    session: Session = Depends(get_session),
    fecha: date,
    id_ciclo: Optional[int] = Query(None)
):
    """
    Obtiene todas las faltas de una fecha específica.
    """
    statement = select(Falta).where(Falta.fecha == fecha)
    
    if id_ciclo:
        statement = statement.where(Falta.id_ciclo == id_ciclo)
    
    statement = statement.order_by(Falta.matricula_estudiante)
    faltas = session.exec(statement).all()
    return faltas

@router.get("/{id_falta}", response_model=FaltaRead)
def get_falta_por_id(
    *,
    session: Session = Depends(get_session),
    id_falta: int
):
    """
    Obtiene una falta específica por su ID.
    """
    db_falta = session.get(Falta, id_falta)
    if not db_falta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Falta con ID {id_falta} no encontrada."
        )
    
    return db_falta

@router.put("/{id_falta}", response_model=FaltaRead)
def update_falta(
    *,
    session: Session = Depends(get_session),
    id_falta: int,
    falta_update: FaltaUpdate
):
    """
    Actualiza una falta existente (principalmente para justificar faltas).
    """
    db_falta = session.get(Falta, id_falta)
    if not db_falta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Falta con ID {id_falta} no encontrada."
        )
    
    # Actualizar los campos que no son None
    update_data = falta_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_falta, field, value)
    
    session.add(db_falta)
    session.commit()
    session.refresh(db_falta)
    
    return db_falta

@router.patch("/{id_falta}/justificar", response_model=FaltaRead)
def justificar_falta(
    *,
    session: Session = Depends(get_session),
    id_falta: int,
    justificacion: str
):
    """
    Justifica una falta específica.
    """
    db_falta = session.get(Falta, id_falta)
    if not db_falta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Falta con ID {id_falta} no encontrada."
        )
    
    db_falta.estado = "Justificado"
    db_falta.justificacion = justificacion
    
    session.add(db_falta)
    session.commit()
    session.refresh(db_falta)
    
    return db_falta

@router.delete("/{id_falta}", status_code=status.HTTP_204_NO_CONTENT)
def delete_falta(
    *,
    session: Session = Depends(get_session),
    id_falta: int
):
    """
    Elimina una falta.
    """
    db_falta = session.get(Falta, id_falta)
    if not db_falta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Falta con ID {id_falta} no encontrada."
        )
    
    session.delete(db_falta)
    session.commit()
    
    return None


# ==================== SISTEMA DE CORTE DE FALTAS ====================

@router.post("/corte", response_model=dict)
def procesar_corte_faltas(
    *,
    session: Session = Depends(get_session),
    fecha_inicio: date = Query(..., description="Fecha de inicio del corte"),
    fecha_fin: date = Query(..., description="Fecha de fin del corte"),
    ciclo_id: int = Query(..., description="ID del ciclo escolar"),
    matricula_estudiante: Optional[str] = Query(None, description="Matrícula específica (opcional)")
):
    """
    Procesa el corte de faltas para un periodo.
    
    - Excluye sábados y domingos (solo cuenta días hábiles)
    - Si la permanencia es menor al 10% no cuenta ni como asistencia ni falta
    - Marca faltas automáticamente para días sin asistencia válida
    """
    from app.services.falta_service import FaltaService
    
    falta_service = FaltaService(session)
    resultado = falta_service.procesar_corte_faltas(
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        ciclo_id=ciclo_id,
        matricula_estudiante=matricula_estudiante
    )
    
    return resultado


@router.get("/reporte-asistencias", response_model=List[dict])
def obtener_reporte_asistencias(
    *,
    session: Session = Depends(get_session),
    fecha_inicio: date = Query(..., description="Fecha de inicio del reporte"),
    fecha_fin: date = Query(..., description="Fecha de fin del reporte"),
    matricula_estudiante: Optional[str] = Query(None, description="Matrícula específica (opcional)")
):
    """
    Genera reporte de asistencias para un periodo antes de hacer el corte.
    
    Muestra:
    - Días hábiles del periodo
    - Asistencias válidas (>= 10% permanencia)
    - Asistencias menores al 10% (no cuentan)
    - Faltas pendientes de registrar
    - Porcentaje de asistencia
    """
    from app.services.falta_service import FaltaService
    
    falta_service = FaltaService(session)
    reporte = falta_service.obtener_reporte_asistencias_periodo(
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        matricula_estudiante=matricula_estudiante
    )
    
    return reporte


@router.get("/dias-habiles", response_model=dict)
def obtener_dias_habiles(
    *,
    fecha_inicio: date = Query(..., description="Fecha de inicio"),
    fecha_fin: date = Query(..., description="Fecha de fin")
):
    """
    Obtiene la lista de días hábiles (Lunes a Viernes) en un rango de fechas.
    Útil para planificar cortes.
    """
    from app.services.falta_service import FaltaService
    
    dias_habiles = FaltaService.obtener_dias_habiles_rango(fecha_inicio, fecha_fin)
    
    return {
        "fecha_inicio": fecha_inicio.isoformat(),
        "fecha_fin": fecha_fin.isoformat(),
        "total_dias_habiles": len(dias_habiles),
        "dias_habiles": [dia.isoformat() for dia in dias_habiles]
    }
