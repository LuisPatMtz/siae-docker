# app/interfaces/nfc_repo_if.py
"""
Interface para el repositorio de NFC (Tarjetas).
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from app.models import NFC, NFCCreate


class INFCRepository(ABC):
    """Contrato para operaciones de NFC"""
    
    @abstractmethod
    def get_all(self) -> List[NFC]:
        """Obtiene todas las tarjetas NFC"""
        pass
    
    @abstractmethod
    def get_by_uid(self, nfc_uid: str) -> Optional[NFC]:
        """Obtiene una tarjeta por su UID"""
        pass
    
    @abstractmethod
    def get_by_matricula(self, matricula: str) -> Optional[NFC]:
        """Obtiene la tarjeta vinculada a un estudiante"""
        pass
    
    @abstractmethod
    def exists_uid(self, nfc_uid: str) -> bool:
        """Verifica si un UID ya está registrado"""
        pass
    
    @abstractmethod
    def exists_matricula(self, matricula: str) -> bool:
        """Verifica si un estudiante ya tiene tarjeta"""
        pass
    
    @abstractmethod
    def create(self, nfc_data: NFCCreate) -> NFC:
        """Crea una nueva tarjeta NFC"""
        pass
    
    @abstractmethod
    def delete_by_uid(self, nfc_uid: str) -> bool:
        """Elimina una tarjeta por UID. Retorna True si existía"""
        pass
    
    @abstractmethod
    def delete_by_matricula(self, matricula: str) -> bool:
        """Elimina la tarjeta de un estudiante. Retorna True si existía"""
        pass
