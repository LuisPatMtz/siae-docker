# app/interfaces/falta_repo_if.py
"""
Interface para el repositorio de Faltas.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import date
from app.models import Falta, FaltaCreate, FaltaUpdate


class IFaltaRepository(ABC):
    """Contrato para operaciones de Faltas"""
    
    @abstractmethod
    def get_all(self) -> List[Falta]:
        """Obtiene todas las faltas"""
        pass
    
    @abstractmethod
    def get_by_id(self, id_falta: int) -> Optional[Falta]:
        """Obtiene una falta por ID"""
        pass
    
    @abstractmethod
    def get_by_matricula(self, matricula: str, id_ciclo: Optional[int] = None) -> List[Falta]:
        """Obtiene todas las faltas de un estudiante"""
        pass
    
    @abstractmethod
    def get_by_fecha(self, fecha: date, id_ciclo: Optional[int] = None) -> List[Falta]:
        """Obtiene todas las faltas de una fecha"""
        pass
    
    @abstractmethod
    def get_filtered(
        self, 
        matricula: Optional[str] = None,
        id_ciclo: Optional[int] = None,
        fecha: Optional[date] = None,
        estado: Optional[str] = None
    ) -> List[Falta]:
        """Obtiene faltas con filtros opcionales"""
        pass
    
    @abstractmethod
    def exists_falta(self, matricula: str, fecha: date) -> bool:
        """Verifica si ya existe una falta para este estudiante en esta fecha"""
        pass
    
    @abstractmethod
    def create(self, falta_data: FaltaCreate) -> Falta:
        """Crea una nueva falta"""
        pass
    
    @abstractmethod
    def update(self, id_falta: int, falta_data: FaltaUpdate) -> Optional[Falta]:
        """Actualiza una falta existente"""
        pass
    
    @abstractmethod
    def justificar(self, id_falta: int, justificacion: str) -> Optional[Falta]:
        """Justifica una falta"""
        pass
    
    @abstractmethod
    def delete(self, id_falta: int) -> bool:
        """Elimina una falta. Retorna True si existía"""
        pass
