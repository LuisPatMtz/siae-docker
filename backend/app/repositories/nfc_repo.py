# app/repositories/nfc_repo.py
"""
Implementación del repositorio de NFC.
"""
from typing import List, Optional
from sqlmodel import Session, select
from app.models import NFC, NFCCreate
from app.interfaces.nfc_repo_if import INFCRepository


class NFCRepository(INFCRepository):
    """Repositorio para gestionar tarjetas NFC"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_all(self) -> List[NFC]:
        """Obtiene todas las tarjetas NFC ordenadas por matrícula"""
        statement = select(NFC).order_by(NFC.matricula_estudiante)
        return list(self.session.exec(statement).all())
    
    def get_by_uid(self, nfc_uid: str) -> Optional[NFC]:
        """Obtiene una tarjeta por su UID"""
        return self.session.get(NFC, nfc_uid)
    
    def get_by_matricula(self, matricula: str) -> Optional[NFC]:
        """Obtiene la tarjeta vinculada a un estudiante"""
        statement = select(NFC).where(NFC.matricula_estudiante == matricula)
        return self.session.exec(statement).first()
    
    def exists_uid(self, nfc_uid: str) -> bool:
        """Verifica si un UID ya está registrado"""
        return self.get_by_uid(nfc_uid) is not None
    
    def exists_matricula(self, matricula: str) -> bool:
        """Verifica si un estudiante ya tiene tarjeta"""
        return self.get_by_matricula(matricula) is not None
    
    def create(self, nfc_data: NFCCreate) -> NFC:
        """Crea una nueva tarjeta NFC"""
        db_nfc = NFC.model_validate(nfc_data)
        self.session.add(db_nfc)
        self.session.commit()
        self.session.refresh(db_nfc)
        return db_nfc
    
    def delete_by_uid(self, nfc_uid: str) -> bool:
        """Elimina una tarjeta por UID. Retorna True si existía"""
        db_nfc = self.get_by_uid(nfc_uid)
        if not db_nfc:
            return False
        
        self.session.delete(db_nfc)
        self.session.commit()
        return True
    
    def delete_by_matricula(self, matricula: str) -> bool:
        """Elimina la tarjeta de un estudiante. Retorna True si existía"""
        db_nfc = self.get_by_matricula(matricula)
        if not db_nfc:
            return False
        
        self.session.delete(db_nfc)
        self.session.commit()
        return True
