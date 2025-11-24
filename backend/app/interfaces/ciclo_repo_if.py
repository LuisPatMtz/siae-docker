# app/interfaces/ciclo_repo_if.py
"""
Interface para repositorio de Ciclo Escolar.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from app.models.ciclo_escolar import CicloEscolar, CicloEscolarCreate, CicloEscolarUpdate

class ICicloRepository(ABC):
    """Contrato para operaciones CRUD de Ciclo Escolar"""
    
    @abstractmethod
    def get_all(self) -> List[CicloEscolar]:
        """Obtiene todos los ciclos"""
        pass
    
    @abstractmethod
    def get_by_id(self, ciclo_id: int) -> Optional[CicloEscolar]:
        """Obtiene un ciclo por ID"""
        pass
    
    @abstractmethod
    def get_activo(self) -> Optional[CicloEscolar]:
        """Obtiene el ciclo activo actual"""
        pass
    
    @abstractmethod
    def get_by_nombre(self, nombre: str) -> Optional[CicloEscolar]:
        """Obtiene un ciclo por su nombre"""
        pass
    
    @abstractmethod
    def create(self, ciclo_data: CicloEscolarCreate) -> CicloEscolar:
        """Crea un nuevo ciclo"""
        pass
    
    @abstractmethod
    def update(self, ciclo_id: int, ciclo_data: CicloEscolarUpdate) -> Optional[CicloEscolar]:
        """Actualiza un ciclo"""
        pass
    
    @abstractmethod
    def activar(self, ciclo_id: int) -> Optional[CicloEscolar]:
        """Activa un ciclo y desactiva los demás"""
        pass
    
    @abstractmethod
    def delete(self, ciclo_id: int) -> bool:
        """Elimina un ciclo (CASCADE). Retorna True si fue eliminado"""
        pass
    
    @abstractmethod
    def exists(self, ciclo_id: int) -> bool:
        """Verifica si existe un ciclo con ese ID"""
        pass
