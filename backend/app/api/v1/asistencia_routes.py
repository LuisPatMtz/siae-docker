# app/api/v1/asistencia_routes.py
"""
Rutas para el registro de asistencia por matrícula.
Sistema de entrada/salida con ventana de 12 horas.
"""
from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy import func
import pytz

from app.db.database import get_session
from app.models import (
    Estudiante,
    Asistencia, AsistenciaCreate, AsistenciaRead,
    Usuario
)

router = APIRouter(
    prefix="/asistencia",
    tags=["Asistencia"]
)

# Zona horaria de México
MEXICO_TZ = pytz.timezone('America/Mexico_City')

@router.post("/registrar", response_model=dict, status_code=status.HTTP_201_CREATED)
def registrar_asistencia(
    matricula: str,
    session: Session = Depends(get_session)
):
    """
    Registra entrada o salida de un estudiante por matrícula.
    
    Lógica:
    - Si no hay entrada en las últimas 12 horas: registra ENTRADA
    - Si hay entrada en las últimas 12 horas sin salida: registra SALIDA
    - Si ya hay entrada y salida: registra nueva ENTRADA
    
    Returns:
        dict con información del registro: tipo, estudiante, timestamp
    """
    # 1. Verificar que el estudiante existe
    estudiante = session.get(Estudiante, matricula)
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudiante con matrícula {matricula} no encontrado."
        )
    
    # 2. Obtener la hora actual en zona horaria de México
    ahora = datetime.now(MEXICO_TZ)
    hace_12_horas = ahora - timedelta(hours=12)
    
    # 3. Buscar la última asistencia en las últimas 12 horas
    ultima_asistencia = session.exec(
        select(Asistencia)
        .where(
            Asistencia.matricula_estudiante == matricula,
            Asistencia.timestamp >= hace_12_horas
        )
        .order_by(Asistencia.timestamp.desc())
    ).first()
    
    # 4. Determinar si es entrada o salida
    if not ultima_asistencia:
        # No hay registro reciente -> ENTRADA
        tipo_registro = "entrada"
    elif ultima_asistencia.tipo == "entrada":
        # Última fue entrada -> SALIDA
        tipo_registro = "salida"
    else:
        # Última fue salida -> nueva ENTRADA
        tipo_registro = "entrada"
    
    # 5. Crear el registro de asistencia
    nueva_asistencia = Asistencia(
        matricula_estudiante=matricula,
        tipo=tipo_registro,
        timestamp=ahora
    )
    
    session.add(nueva_asistencia)
    session.commit()
    session.refresh(nueva_asistencia)
    
    # 6. Preparar respuesta con información completa
    return {
        "id": nueva_asistencia.id,
        "tipo": tipo_registro,
        "timestamp": nueva_asistencia.timestamp.isoformat(),
        "estudiante": {
            "matricula": estudiante.matricula,
            "nombre": estudiante.nombre,
            "apellido": estudiante.apellido,
            "grupo": estudiante.grupo.nombre if estudiante.grupo else None
        },
        "mensaje": f"{'Entrada' if tipo_registro == 'entrada' else 'Salida'} registrada exitosamente"
    }


@router.get("/estudiante/{matricula}", response_model=List[AsistenciaRead])
def obtener_historial_estudiante(
    matricula: str,
    session: Session = Depends(get_session)
):
    """
    Obtiene el historial completo de asistencias de un estudiante.
    """
    # Verificar que el estudiante existe
    estudiante = session.get(Estudiante, matricula)
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudiante con matrícula {matricula} no encontrado."
        )
    
    # Obtener todas las asistencias del estudiante
    asistencias = session.exec(
        select(Asistencia)
        .where(Asistencia.matricula_estudiante == matricula)
        .order_by(Asistencia.timestamp.desc())
    ).all()
    
    return asistencias


@router.get("/hoy", response_model=List[dict])
def obtener_asistencias_hoy(session: Session = Depends(get_session)):
    """
    Obtiene todas las asistencias registradas hoy.
    Incluye información del estudiante.
    """
    # Obtener fecha de hoy en zona horaria de México
    hoy = datetime.now(MEXICO_TZ).date()
    
    # Buscar todas las asistencias de hoy
    asistencias = session.exec(
        select(Asistencia)
        .where(func.date(Asistencia.timestamp) == hoy)
        .order_by(Asistencia.timestamp.desc())
    ).all()
    
    # Enriquecer con información del estudiante
    resultado = []
    for asistencia in asistencias:
        estudiante = session.get(Estudiante, asistencia.matricula_estudiante)
        if estudiante:
            resultado.append({
                "id": asistencia.id,
                "tipo": asistencia.tipo,
                "timestamp": asistencia.timestamp.isoformat(),
                "estudiante": {
                    "matricula": estudiante.matricula,
                    "nombre": estudiante.nombre,
                    "apellido": estudiante.apellido,
                    "grupo": estudiante.grupo.nombre if estudiante.grupo else None
                }
            })
    
    return resultado


@router.get("/estadisticas/hoy", response_model=dict)
def obtener_estadisticas_hoy(session: Session = Depends(get_session)):
    """
    Obtiene estadísticas de asistencia del día actual.
    """
    hoy = datetime.now(MEXICO_TZ).date()
    
    # Contar entradas y salidas de hoy
    total_entradas = session.exec(
        select(func.count(Asistencia.id))
        .where(
            func.date(Asistencia.timestamp) == hoy,
            Asistencia.tipo == "entrada"
        )
    ).one()
    
    total_salidas = session.exec(
        select(func.count(Asistencia.id))
        .where(
            func.date(Asistencia.timestamp) == hoy,
            Asistencia.tipo == "salida"
        )
    ).one()
    
    return {
        "fecha": hoy.isoformat(),
        "total_entradas": total_entradas,
        "total_salidas": total_salidas,
        "estudiantes_presentes": total_entradas - total_salidas
    }
