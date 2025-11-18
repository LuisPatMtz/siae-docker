# app/services/nfc_service.py
"""
Servicio de lógica de negocio para NFC (Tarjetas).
"""
from typing import List
from sqlmodel import Session
from fastapi import HTTPException, status

from app.models import NFC, NFCCreate, NFCRead, Estudiante
from app.repositories.nfc_repo import NFCRepository


class NFCService:
    """Servicio para gestionar tarjetas NFC"""
    
    def __init__(self, session: Session):
        self.session = session
        self.nfc_repo = NFCRepository(session)
    
    def vincular_tarjeta(self, nfc_data: NFCCreate) -> NFC:
        """
        Vincula una tarjeta NFC a un estudiante.
        Valida:
        - Que el estudiante exista
        - Que el UID no esté ya registrado
        - Que el estudiante no tenga ya una tarjeta
        """
        # Verificar que el estudiante exista
        estudiante = self.session.get(Estudiante, nfc_data.matricula_estudiante)
        if not estudiante:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"La matrícula '{nfc_data.matricula_estudiante}' no existe. No se puede vincular la tarjeta."
            )
        
        # Verificar que el NFC UID no esté ya registrado
        if self.nfc_repo.exists_uid(nfc_data.nfc_uid):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El NFC UID '{nfc_data.nfc_uid}' ya está registrado y vinculado a otra matrícula."
            )
        
        # Verificar que el estudiante no tenga ya una tarjeta NFC
        if self.nfc_repo.exists_matricula(nfc_data.matricula_estudiante):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El estudiante '{nfc_data.matricula_estudiante}' ya tiene una tarjeta NFC vinculada."
            )
        
        # Crear la tarjeta
        return self.nfc_repo.create(nfc_data)
    
    def obtener_todas_las_tarjetas(self) -> List[NFC]:
        """Obtiene todas las tarjetas NFC registradas"""
        return self.nfc_repo.get_all()
    
    def obtener_por_uid(self, nfc_uid: str) -> NFC:
        """Obtiene una tarjeta por su UID"""
        nfc = self.nfc_repo.get_by_uid(nfc_uid)
        if not nfc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tarjeta NFC con UID '{nfc_uid}' no encontrada."
            )
        return nfc
    
    def obtener_por_estudiante(self, matricula: str) -> NFC:
        """Obtiene la tarjeta NFC de un estudiante"""
        # Verificar que el estudiante existe
        estudiante = self.session.get(Estudiante, matricula)
        if not estudiante:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Estudiante con matrícula '{matricula}' no encontrado."
            )
        
        nfc = self.nfc_repo.get_by_matricula(matricula)
        if not nfc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"El estudiante '{matricula}' no tiene una tarjeta NFC vinculada."
            )
        return nfc
    
    def eliminar_por_uid(self, nfc_uid: str) -> None:
        """Elimina una tarjeta por UID"""
        if not self.nfc_repo.delete_by_uid(nfc_uid):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tarjeta NFC con UID '{nfc_uid}' no encontrada."
            )
    
    def eliminar_por_estudiante(self, matricula: str) -> None:
        """Elimina la tarjeta de un estudiante"""
        # Verificar que el estudiante existe
        estudiante = self.session.get(Estudiante, matricula)
        if not estudiante:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Estudiante con matrícula '{matricula}' no encontrado."
            )
        
        if not self.nfc_repo.delete_by_matricula(matricula):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"El estudiante '{matricula}' no tiene una tarjeta NFC vinculada."
            )
