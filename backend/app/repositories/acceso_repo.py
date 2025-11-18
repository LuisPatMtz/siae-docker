# app/repositories/acceso_repo.py
"""
Implementación del repositorio de Accesos.
"""
from typing import List, Optional
from datetime import date, datetime
from sqlmodel import Session, select, func
from app.models import Acceso, NFC
from app.interfaces.acceso_repo_if import IAccesoRepository


class AccesoRepository(IAccesoRepository):
    """Repositorio para gestionar accesos"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_all(self) -> List[Acceso]:
        """Obtiene todos los accesos ordenados por fecha descendente"""
        statement = select(Acceso).order_by(Acceso.hora_registro.desc())
        return list(self.session.exec(statement).all())
    
    def get_by_matricula(self, matricula: str) -> List[Acceso]:
        """Obtiene el historial de accesos de un estudiante"""
        statement = (
            select(Acceso)
            .join(NFC, Acceso.nfc_uid == NFC.nfc_uid)
            .where(NFC.matricula_estudiante == matricula)
            .order_by(Acceso.hora_registro.desc())
        )
        return list(self.session.exec(statement).all())
    
    def get_by_ciclo(self, id_ciclo: int) -> List[Acceso]:
        """Obtiene todos los accesos de un ciclo escolar"""
        statement = (
            select(Acceso)
            .where(Acceso.id_ciclo == id_ciclo)
            .order_by(Acceso.hora_registro.desc())
        )
        return list(self.session.exec(statement).all())
    
    def get_by_fecha(self, fecha: date, id_ciclo: Optional[int] = None) -> List[Acceso]:
        """Obtiene accesos de una fecha específica"""
        statement = select(Acceso).where(func.date(Acceso.hora_registro) == fecha)
        
        if id_ciclo:
            statement = statement.where(Acceso.id_ciclo == id_ciclo)
        
        statement = statement.order_by(Acceso.hora_registro.desc())
        return list(self.session.exec(statement).all())
    
    def exists_acceso_hoy(self, nfc_uid: str, fecha: date, id_ciclo: int) -> bool:
        """Verifica si ya existe un acceso para esta tarjeta en la fecha"""
        statement = (
            select(Acceso)
            .where(
                Acceso.nfc_uid == nfc_uid,
                Acceso.id_ciclo == id_ciclo,
                func.date(Acceso.hora_registro) == fecha
            )
        )
        return self.session.exec(statement).first() is not None
    
    def create(self, nfc_uid: str, id_ciclo: int, hora_registro: datetime) -> Acceso:
        """Crea un nuevo registro de acceso"""
        nuevo_acceso = Acceso(
            nfc_uid=nfc_uid,
            id_ciclo=id_ciclo,
            hora_registro=hora_registro
        )
        self.session.add(nuevo_acceso)
        self.session.commit()
        self.session.refresh(nuevo_acceso)
        return nuevo_acceso
    
    def count_accesos_periodo(self, start_date: date, end_date: date, id_ciclo: int) -> int:
        """Cuenta los accesos en un período"""
        statement = (
            select(func.count(Acceso.id))
            .where(
                func.date(Acceso.hora_registro) >= start_date,
                func.date(Acceso.hora_registro) <= end_date,
                Acceso.id_ciclo == id_ciclo
            )
        )
        result = self.session.exec(statement).first()
        return result or 0
