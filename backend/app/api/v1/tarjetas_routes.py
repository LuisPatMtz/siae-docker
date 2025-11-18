# app/api/v1/tarjetas.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db.database import get_session
from app.models import (
    NFC, 
    NFCCreate, 
    NFCRead,
    Estudiante
)
from app.core.security import get_current_user

router = APIRouter(
    prefix="/nfc",
    tags=["Tarjetas NFC"],
    dependencies=[Depends(get_current_user)]
)

@router.post("", response_model=NFCRead, status_code=status.HTTP_201_CREATED)
def create_nfc(
    *,
    session: Session = Depends(get_session),
    nfc: NFCCreate
):
    """
    Crea una nueva tarjeta NFC y la vincula a un estudiante.
    Este es el endpoint que usa la página 'Gestión de Estudiantes'.
    """
    
    # Verificar que el estudiante (matrícula) exista
    db_estudiante = session.get(Estudiante, nfc.matricula_estudiante)
    if not db_estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La matrícula '{nfc.matricula_estudiante}' no existe. No se puede vincular la tarjeta."
        )

    # Verificar que el NFC UID no esté ya registrado
    db_nfc_existente = session.get(NFC, nfc.nfc_uid)
    if db_nfc_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El NFC UID '{nfc.nfc_uid}' ya está registrado y vinculado a otra matrícula."
        )
    
    # Verificar que el estudiante no tenga ya una tarjeta NFC
    nfc_estudiante = session.exec(
        select(NFC).where(NFC.matricula_estudiante == nfc.matricula_estudiante)
    ).first()
    if nfc_estudiante:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El estudiante '{nfc.matricula_estudiante}' ya tiene una tarjeta NFC vinculada."
        )
    
    # Crear y guardar la nueva tarjeta NFC
    db_nfc = NFC.model_validate(nfc)
    session.add(db_nfc)
    session.commit()
    session.refresh(db_nfc)
    
    return db_nfc

@router.get("", response_model=List[NFCRead])
def get_all_nfc(
    *,
    session: Session = Depends(get_session)
):
    """
    Obtiene todas las tarjetas NFC registradas.
    """
    statement = select(NFC).order_by(NFC.matricula_estudiante)
    nfcs = session.exec(statement).all()
    return nfcs

@router.get("/{nfc_uid}", response_model=NFCRead)
def get_nfc_by_uid(
    *,
    session: Session = Depends(get_session),
    nfc_uid: str
):
    """
    Obtiene una tarjeta NFC específica por su UID.
    """
    db_nfc = session.get(NFC, nfc_uid)
    if not db_nfc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tarjeta NFC con UID '{nfc_uid}' no encontrada."
        )
    
    return db_nfc

@router.get("/estudiante/{matricula}", response_model=NFCRead)
def get_nfc_by_student(
    *,
    session: Session = Depends(get_session),
    matricula: str
):
    """
    Obtiene la tarjeta NFC de un estudiante específico.
    """
    # Verificar que el estudiante existe
    db_estudiante = session.get(Estudiante, matricula)
    if not db_estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudiante con matrícula '{matricula}' no encontrado."
        )
    
    db_nfc = session.exec(
        select(NFC).where(NFC.matricula_estudiante == matricula)
    ).first()
    
    if not db_nfc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El estudiante '{matricula}' no tiene una tarjeta NFC vinculada."
        )
    
    return db_nfc

@router.delete("/{nfc_uid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nfc(
    *,
    session: Session = Depends(get_session),
    nfc_uid: str
):
    """
    Elimina una tarjeta NFC.
    """
    db_nfc = session.get(NFC, nfc_uid)
    if not db_nfc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tarjeta NFC con UID '{nfc_uid}' no encontrada."
        )
    
    session.delete(db_nfc)
    session.commit()
    
    return None

@router.delete("/estudiante/{matricula}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nfc_by_student(
    *,
    session: Session = Depends(get_session),
    matricula: str
):
    """
    Elimina la tarjeta NFC de un estudiante específico.
    """
    # Verificar que el estudiante existe
    db_estudiante = session.get(Estudiante, matricula)
    if not db_estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudiante con matrícula '{matricula}' no encontrado."
        )
    
    db_nfc = session.exec(
        select(NFC).where(NFC.matricula_estudiante == matricula)
    ).first()
    
    if not db_nfc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El estudiante '{matricula}' no tiene una tarjeta NFC vinculada."
        )
    
    session.delete(db_nfc)
    session.commit()
    
    return None