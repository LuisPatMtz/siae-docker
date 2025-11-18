# app/interfaces/estudiante_repo_if.py
"""
Interface para repositorio de Estudiante.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from app.models.estudiante import Estudiante, EstudianteCreate, EstudianteUpdate

class IEstudianteRepository(ABC):
    """Contrato para operaciones CRUD de Estudiante"""
    
    @abstractmethod
    def get_all(self) -> List[Estudiante]:
        """Obtiene todos los estudiantes (sin relaciones)"""
        pass
    
    @abstractmethod
    def get_all_complete(self) -> List[Estudiante]:
        """Obtiene todos los estudiantes con relaciones (grupo, ciclo, nfc)"""
        pass
    
    @abstractmethod
    def get_by_matricula(self, matricula: str) -> Optional[Estudiante]:
        """Obtiene un estudiante por matrícula"""
        pass
    
    @abstractmethod
    def get_by_grupo(self, grupo_id: int) -> List[Estudiante]:
        """Obtiene estudiantes de un grupo"""
        pass
    
    @abstractmethod
    def get_by_ciclo(self, ciclo_id: int) -> List[Estudiante]:
        """Obtiene estudiantes de un ciclo"""
        pass
    
    @abstractmethod
    def create(self, estudiante_data: EstudianteCreate) -> Estudiante:
        """Crea un nuevo estudiante"""
        pass
    
    @abstractmethod
    def update(self, matricula: str, estudiante_data: EstudianteUpdate) -> Optional[Estudiante]:
        """Actualiza un estudiante"""
        pass
    
    @abstractmethod
    def bulk_move_grupo(self, matriculas: List[str], nuevo_id_grupo: int) -> int:
        """Mueve múltiples estudiantes a un nuevo grupo. Retorna cantidad actualizada"""
        pass
    
    @abstractmethod
    def delete(self, matricula: str) -> bool:
        """Elimina un estudiante (CASCADE). Retorna True si fue eliminado"""
        pass
    
    @abstractmethod
    def exists(self, matricula: str) -> bool:
        """Verifica si existe un estudiante con esa matrícula"""
        pass
