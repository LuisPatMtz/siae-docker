# app/interfaces/justificacion_repo_if.py
"""
Interfaz para el repositorio de Justificaciones.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from app.models.justificacion import Justificacion, JustificacionCreate


class IJustificacionRepository(ABC):
    """Interfaz para operaciones CRUD de justificaciones"""
    
    @abstractmethod
    def get_all(self) -> List[Justificacion]:
        """Obtiene todas las justificaciones"""
        pass
    
    @abstractmethod
    def get_by_id(self, id_justificacion: int) -> Optional[Justificacion]:
        """Obtiene una justificación por ID"""
        pass
    
    @abstractmethod
    def create(self, justificacion_data: JustificacionCreate) -> Justificacion:
        """Crea una nueva justificación"""
        pass
    
    @abstractmethod
    def delete(self, id_justificacion: int) -> bool:
        """Elimina una justificación"""
        pass
