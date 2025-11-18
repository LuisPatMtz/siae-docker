# app/interfaces/acceso_repo_if.py
"""
Interface para el repositorio de Accesos.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import date, datetime
from app.models import Acceso, AccesoCreate


class IAccesoRepository(ABC):
    """Contrato para operaciones de Acceso"""
    
    @abstractmethod
    def get_all(self) -> List[Acceso]:
        """Obtiene todos los accesos"""
        pass
    
    @abstractmethod
    def get_by_matricula(self, matricula: str) -> List[Acceso]:
        """Obtiene el historial de accesos de un estudiante"""
        pass
    
    @abstractmethod
    def get_by_ciclo(self, id_ciclo: int) -> List[Acceso]:
        """Obtiene todos los accesos de un ciclo escolar"""
        pass
    
    @abstractmethod
    def get_by_fecha(self, fecha: date, id_ciclo: Optional[int] = None) -> List[Acceso]:
        """Obtiene accesos de una fecha específica"""
        pass
    
    @abstractmethod
    def exists_acceso_hoy(self, nfc_uid: str, fecha: date, id_ciclo: int) -> bool:
        """Verifica si ya existe un acceso para esta tarjeta en la fecha"""
        pass
    
    @abstractmethod
    def create(self, nfc_uid: str, id_ciclo: int, hora_registro: datetime) -> Acceso:
        """Crea un nuevo registro de acceso"""
        pass
    
    @abstractmethod
    def count_accesos_periodo(self, start_date: date, end_date: date, id_ciclo: int) -> int:
        """Cuenta los accesos en un período"""
        pass
