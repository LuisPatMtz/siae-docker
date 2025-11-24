# app/api/v1/asistencia_routes.py
"""
Rutas para el registro de asistencia por matrícula.
Sistema de entrada/salida con validación de rango 1-8 horas.
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
    Usuario,
    NFC, NfcPayload
)

router = APIRouter(
    prefix="/asistencia",
    tags=["Asistencia"]
)

# Zona horaria de México
MEXICO_TZ = pytz.timezone('America/Mexico_City')

# Constantes de validación
HORA_MINIMA = 1  # Mínimo 1 hora entre entrada y salida
HORA_MAXIMA = 8  # Máximo 8 horas entre entrada y salida

@router.post("/registrar", response_model=dict, status_code=status.HTTP_201_CREATED)
def registrar_asistencia(
    matricula: str,
    session: Session = Depends(get_session)
):
    """
    Registra entrada o salida de un estudiante por matrícula.
    
    Lógica con validación de rango 1-8 horas:
    - Si no hay entrada en las últimas 8 horas: registra ENTRADA (es_valida=None)
    - Si hay entrada en las últimas 8 horas sin salida válida:
        * Valida tiempo transcurrido
        * Si < 1 hora: ERROR "Debes permanecer al menos 1 hora"
        * Si > 8 horas: ERROR "Tiempo máximo excedido (8 horas)"
        * Si 1-8 horas: registra SALIDA (es_valida=True) y actualiza entrada
    - Si ya hay entrada y salida válidas: registra nueva ENTRADA
    
    Returns:
        dict con información del registro: tipo, estudiante, timestamp, es_valida
    """
    try:
        # 1. Verificar que el estudiante existe
        estudiante = session.get(Estudiante, matricula)
        if not estudiante:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Estudiante con matrícula {matricula} no encontrado."
            )
        
        # 2. Obtener la hora actual en zona horaria de México
        ahora = datetime.now(MEXICO_TZ)
        hace_8_horas = ahora - timedelta(hours=HORA_MAXIMA)
        
        # 3. Buscar la última entrada en las últimas 8 horas sin salida válida
        ultima_entrada = session.exec(
            select(Asistencia)
            .where(
                Asistencia.matricula_estudiante == matricula,
                Asistencia.tipo == "entrada",
                Asistencia.timestamp >= hace_8_horas,
                Asistencia.es_valida == None  # Entrada sin salida válida
            )
            .order_by(Asistencia.timestamp.desc())
        ).first()
        
        # 4. Determinar si es entrada o salida
        if not ultima_entrada:
            # No hay entrada reciente sin salida -> NUEVA ENTRADA
            tipo_registro = "entrada"
            es_valida = None  # Pendiente de salida
            entrada_relacionada_id = None
            mensaje = "Entrada registrada exitosamente. Recuerda registrar tu salida entre 1 y 8 horas."
            
            nueva_asistencia = Asistencia(
                matricula_estudiante=matricula,
                tipo=tipo_registro,
                timestamp=ahora,
            session.add(nueva_asistencia)
            session.commit()
            session.refresh(nueva_asistencia)
            
        else:
            # Hay entrada reciente -> Intentar registrar SALIDA
            # Asegurar que el timestamp de la DB tenga zona horaria
            entrada_timestamp = ultima_entrada.timestamp
            if entrada_timestamp.tzinfo is None:
                entrada_timestamp = MEXICO_TZ.localize(entrada_timestamp)
            
            tiempo_transcurrido = ahora - entrada_timestamp
            horas_transcurridas = tiempo_transcurrido.total_seconds() / 3600
            
            # Validar rango de tiempo
            if horas_transcurridas < HORA_MINIMA:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Debes permanecer al menos {HORA_MINIMA} hora(s) antes de registrar tu salida. "
                           f"Tiempo transcurrido: {int(horas_transcurridas * 60)} minutos."
                )
            
            if horas_transcurridas > HORA_MAXIMA:
                # Marcar entrada como inválida y permitir nueva entrada
                ultima_entrada.es_valida = False
                session.add(ultima_entrada)
                session.commit()
                
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Tiempo máximo excedido ({HORA_MAXIMA} horas). "
                           f"Tu entrada anterior ha sido marcada como inválida. "
                           f"Por favor registra una nueva entrada."
                )
            
            # Rango válido (1-8 horas) -> Registrar SALIDA
            tipo_registro = "salida"
            es_valida = True
            entrada_relacionada_id = ultima_entrada.id
            mensaje = f"Salida registrada exitosamente. Tiempo de permanencia: {int(horas_transcurridas)} horas y {int((horas_transcurridas % 1) * 60)} minutos."
            
            # Crear salida
            nueva_asistencia = Asistencia(
                matricula_estudiante=matricula,
                tipo=tipo_registro,
                timestamp=ahora,
                es_valida=es_valida,
                entrada_relacionada_id=entrada_relacionada_id
            )
            
            # Actualizar entrada como válida
            ultima_entrada.es_valida = True
            
            session.add(nueva_asistencia)
            session.add(ultima_entrada)
            session.commit()
            session.refresh(nueva_asistencia)
        
        # 5. Preparar respuesta con información completa
        return {
            "id": nueva_asistencia.id,
            "tipo": tipo_registro,
            "timestamp": nueva_asistencia.timestamp.isoformat(),
            "es_valida": nueva_asistencia.es_valida,
            "entrada_relacionada_id": nueva_asistencia.entrada_relacionada_id,
            "estudiante": {
                "matricula": estudiante.matricula,
                "nombre": estudiante.nombre,
                "apellido": estudiante.apellido,
                "grupo": estudiante.grupo.nombre if estudiante.grupo else None
            },
            "mensaje": mensaje
        }
    except Exception as e:
        print(f"ERROR en registrar_asistencia: {e}")
        import traceback
        traceback.print_exc()
        raise e


@router.post("/registrar-nfc", response_model=dict, status_code=status.HTTP_201_CREATED)
def registrar_asistencia_nfc(
    payload: NfcPayload,
    session: Session = Depends(get_session)
):
    """
    Registra asistencia mediante tarjeta NFC.
    Busca la matrícula asociada al NFC y llama a la lógica de registro.
    """
    # 1. Buscar la tarjeta NFC
    nfc = session.get(NFC, payload.nfc_uid)
    if not nfc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarjeta NFC no reconocida o no vinculada."
        )
    
    # 2. Llamar a la función de registro por matrícula
    # Reutilizamos la lógica existente pasando la matrícula encontrada
    return registrar_asistencia(matricula=nfc.matricula_estudiante, session=session)


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
                "es_valida": asistencia.es_valida,
                "entrada_relacionada_id": asistencia.entrada_relacionada_id,
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
    Incluye asistencias válidas, inválidas y pendientes.
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
    
    # Contar asistencias válidas (entrada + salida en rango 1-8h)
    asistencias_validas = session.exec(
        select(func.count(Asistencia.id))
        .where(
            func.date(Asistencia.timestamp) == hoy,
            Asistencia.tipo == "salida",
            Asistencia.es_valida == True
        )
    ).one()
    
    # Contar asistencias inválidas
    asistencias_invalidas = session.exec(
        select(func.count(Asistencia.id))
        .where(
            func.date(Asistencia.timestamp) == hoy,
            Asistencia.es_valida == False
        )
    ).one()
    
    # Contar estudiantes con entrada sin salida (pendientes)
    entradas_pendientes = session.exec(
        select(func.count(Asistencia.id))
        .where(
            func.date(Asistencia.timestamp) == hoy,
            Asistencia.tipo == "entrada",
            Asistencia.es_valida == None
        )
    ).one()
    
    return {
        "fecha": hoy.isoformat(),
        "total_entradas": total_entradas,
        "total_salidas": total_salidas,
        "asistencias_validas": asistencias_validas,
        "asistencias_invalidas": asistencias_invalidas,
        "entradas_pendientes": entradas_pendientes,
        "estudiantes_presentes": total_entradas - total_salidas
    }


@router.get("/validas", response_model=List[dict])
def obtener_asistencias_validas(
    fecha_inicio: str = None,
    fecha_fin: str = None,
    session: Session = Depends(get_session)
):
    """
    Obtiene solo las asistencias válidas (entrada + salida en rango 1-8h).
    
    Parámetros opcionales:
    - fecha_inicio: Fecha de inicio en formato YYYY-MM-DD
    - fecha_fin: Fecha de fin en formato YYYY-MM-DD
    """
    query = select(Asistencia).where(
        Asistencia.tipo == "salida",
        Asistencia.es_valida == True
    )
    
    # Filtrar por rango de fechas si se proporciona
    if fecha_inicio:
        fecha_inicio_dt = datetime.fromisoformat(fecha_inicio).date()
        query = query.where(func.date(Asistencia.timestamp) >= fecha_inicio_dt)
    
    if fecha_fin:
        fecha_fin_dt = datetime.fromisoformat(fecha_fin).date()
        query = query.where(func.date(Asistencia.timestamp) <= fecha_fin_dt)
    
    asistencias_validas = session.exec(query.order_by(Asistencia.timestamp.desc())).all()
    
    # Enriquecer con información del estudiante y entrada relacionada
    resultado = []
    for asistencia in asistencias_validas:
        estudiante = session.get(Estudiante, asistencia.matricula_estudiante)
        entrada = session.get(Asistencia, asistencia.entrada_relacionada_id) if asistencia.entrada_relacionada_id else None
        
        if estudiante:
            tiempo_permanencia = None
            if entrada:
                tiempo_transcurrido = asistencia.timestamp - entrada.timestamp
                horas = tiempo_transcurrido.total_seconds() / 3600
                tiempo_permanencia = f"{int(horas)}h {int((horas % 1) * 60)}min"
            
            resultado.append({
                "id": asistencia.id,
                "fecha": asistencia.timestamp.date().isoformat(),
                "hora_entrada": entrada.timestamp.time().isoformat() if entrada else None,
                "hora_salida": asistencia.timestamp.time().isoformat(),
                "tiempo_permanencia": tiempo_permanencia,
                "estudiante": {
                    "matricula": estudiante.matricula,
                    "nombre": estudiante.nombre,
                    "apellido": estudiante.apellido,
                    "grupo": estudiante.grupo.nombre if estudiante.grupo else None
                }
            })
    
    return resultado
