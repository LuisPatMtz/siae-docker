# app/api/v1/acceso.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.db.database import get_session
from app.models import (
    NFC, NFCCreate, Estudiante, 
    Acceso, AccesoCreate, AccesoRead, NfcPayload,
    CicloEscolar
)

router = APIRouter(
    tags=["Acceso y NFC"]
)

@router.post("/nfc/vincular", response_model=NFC, status_code=status.HTTP_201_CREATED)
def vincular_nfc(nfc_in: NFCCreate, session: Session = Depends(get_session)):
    """
    Vincula una tarjeta NFC a un estudiante
    """
    estudiante = session.get(Estudiante, nfc_in.matricula_estudiante)
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudiante con matrícula {nfc_in.matricula_estudiante} no encontrado."
        )
    
    # Verificar si el NFC ya existe
    nfc_existente = session.get(NFC, nfc_in.nfc_uid)
    if nfc_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"NFC {nfc_in.nfc_uid} ya está vinculado."
        )
    
    # Verificar si el estudiante ya tiene una tarjeta NFC
    nfc_estudiante = session.exec(
        select(NFC).where(NFC.matricula_estudiante == nfc_in.matricula_estudiante)
    ).first()
    if nfc_estudiante:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El estudiante {nfc_in.matricula_estudiante} ya tiene una tarjeta NFC vinculada."
        )

    db_nfc = NFC.model_validate(nfc_in)
    session.add(db_nfc)
    session.commit()
    session.refresh(db_nfc)
    return db_nfc

@router.post("/acceso/registrar", response_model=AccesoRead, status_code=status.HTTP_201_CREATED)
def registrar_acceso(payload: NfcPayload, session: Session = Depends(get_session)):
    """
    Registra un acceso cuando se escanea una tarjeta NFC.
    Solo permite un acceso por estudiante por día.
    Si se proporciona fecha_registro (formato YYYY-MM-DD), se usa esa fecha (modo prueba).
    """
    from datetime import datetime
    from sqlalchemy import func
    import pytz
    
    # Usar zona horaria de México
    MEXICO_TZ = pytz.timezone('America/Mexico_City')
    
    # Determinar la fecha a usar
    if payload.fecha_registro:
        try:
            # Modo prueba: usar la fecha proporcionada
            fecha_obj = datetime.strptime(payload.fecha_registro, '%Y-%m-%d')
            hoy = fecha_obj.date()
            # Crear datetime con hora actual pero fecha especificada
            hora_registro = MEXICO_TZ.localize(
                datetime.combine(hoy, datetime.now(MEXICO_TZ).time())
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de fecha inválido. Use YYYY-MM-DD"
            )
    else:
        # Modo normal: usar fecha y hora actual
        hoy = datetime.now(MEXICO_TZ).date()
        hora_registro = datetime.now(MEXICO_TZ)
    
    nfc = session.get(NFC, payload.nfc_uid)
    
    if not nfc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarjeta NFC no reconocida o no vinculada."
        )
    
    # Obtener el ciclo escolar activo
    ciclo_activo = session.exec(
        select(CicloEscolar).where(CicloEscolar.activo == True)
    ).first()
    
    if not ciclo_activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay un ciclo escolar activo."
        )
    
    # Verificar si ya existe un acceso en esa fecha para este estudiante
    acceso_existente = session.exec(
        select(Acceso)
        .where(
            Acceso.nfc_uid == nfc.nfc_uid,
            Acceso.id_ciclo == ciclo_activo.id,
            func.date(Acceso.hora_registro) == hoy
        )
    ).first()
    
    if acceso_existente:
        # Obtener el estudiante para mostrar su nombre
        estudiante = session.get(Estudiante, nfc.matricula_estudiante)
        nombre_completo = f"{estudiante.nombre} {estudiante.apellido}" if estudiante else "el estudiante"
        
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya se registró un acceso el {hoy.strftime('%Y-%m-%d')} para {nombre_completo} a las {acceso_existente.hora_registro.strftime('%H:%M:%S')}."
        )

    # Crear nuevo acceso con la fecha/hora determinada
    nuevo_acceso = Acceso(
        nfc_uid=nfc.nfc_uid,
        id_ciclo=ciclo_activo.id,
        hora_registro=hora_registro
    )
    session.add(nuevo_acceso)
    session.commit()
    session.refresh(nuevo_acceso)
    
    return nuevo_acceso

@router.get("/acceso/{matricula}", response_model=List[AccesoRead])
def obtener_historial_por_matricula(matricula: str, session: Session = Depends(get_session)):
    """
    Obtiene el historial de accesos de un estudiante por su matrícula
    """
    # Verificar que el estudiante existe
    estudiante = session.get(Estudiante, matricula)
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudiante con matrícula {matricula} no encontrado."
        )
    
    statement = (
        select(Acceso)
        .join(NFC)
        .where(NFC.matricula_estudiante == matricula)
        .order_by(Acceso.hora_registro.desc())  
    )
    
    registros = session.exec(statement).all()
    return registros

@router.get("/acceso/ciclo/{id_ciclo}", response_model=List[AccesoRead])
def obtener_accesos_por_ciclo(id_ciclo: int, session: Session = Depends(get_session)):
    """
    Obtiene todos los accesos de un ciclo escolar específico
    """
    ciclo = session.get(CicloEscolar, id_ciclo)
    if not ciclo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ciclo escolar con ID {id_ciclo} no encontrado."
        )
    
    statement = (
        select(Acceso)
        .where(Acceso.id_ciclo == id_ciclo)
        .order_by(Acceso.hora_registro.desc())
    )
    
    registros = session.exec(statement).all()
    return registros