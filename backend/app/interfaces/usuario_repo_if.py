# app/interfaces/usuario_repo_if.py
"""
Interface para repositorio de Usuario.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from app.models.usuario import Usuario
from app.models.auth import AdminUserCreate, UserPermissionsUpdate, UserUpdate

class IUsuarioRepository(ABC):
    """Contrato para operaciones CRUD de Usuario"""
    
    @abstractmethod
    def get_all(self) -> List[Usuario]:
        """Obtiene todos los usuarios"""
        pass
    
    @abstractmethod
    def get_by_id(self, user_id: int) -> Optional[Usuario]:
        """Obtiene un usuario por ID"""
        pass
    
    @abstractmethod
    def get_by_username(self, username: str) -> Optional[Usuario]:
        """Obtiene un usuario por username"""
        pass
    
    @abstractmethod
    def create(self, user_data: AdminUserCreate) -> Usuario:
        """Crea un nuevo usuario"""
        pass
    
    @abstractmethod
    def update(self, user_id: int, user_data: UserUpdate) -> Optional[Usuario]:
        """Actualiza un usuario"""
        pass
    
    @abstractmethod
    def update_permissions(self, user_id: int, permissions_data: UserPermissionsUpdate) -> Optional[Usuario]:
        """Actualiza solo los permisos de un usuario"""
        pass
    
    @abstractmethod
    def delete(self, user_id: int) -> bool:
        """Elimina un usuario. Retorna True si fue eliminado"""
        pass
