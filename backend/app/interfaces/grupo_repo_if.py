# app/interfaces/grupo_repo_if.py
"""
Interface para repositorio de Grupo.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from app.models.grupo import Grupo, GrupoCreate, GrupoUpdate

class IGrupoRepository(ABC):
    """Contrato para operaciones CRUD de Grupo"""
    
    @abstractmethod
    def get_all(self) -> List[Grupo]:
        """Obtiene todos los grupos"""
        pass
    
    @abstractmethod
    def get_by_id(self, grupo_id: int) -> Optional[Grupo]:
        """Obtiene un grupo por ID"""
        pass
    
    @abstractmethod
    def get_by_nombre(self, nombre: str) -> Optional[Grupo]:
        """Obtiene un grupo por nombre"""
        pass
    
    @abstractmethod
    def get_by_turno(self, turno: str) -> List[Grupo]:
        """Obtiene grupos de un turno específico"""
        pass
    
    @abstractmethod
    def create(self, grupo_data: GrupoCreate) -> Grupo:
        """Crea un nuevo grupo"""
        pass
    
    @abstractmethod
    def update(self, grupo_id: int, grupo_data: GrupoUpdate) -> Optional[Grupo]:
        """Actualiza un grupo"""
        pass
    
    @abstractmethod
    def delete(self, grupo_id: int) -> bool:
        """Elimina un grupo. Retorna True si fue eliminado"""
        pass
    
    @abstractmethod
    def exists(self, grupo_id: int) -> bool:
        """Verifica si existe un grupo con ese ID"""
        pass
