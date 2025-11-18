# app/repositories/usuario_repo.py
"""
Implementación del repositorio de Usuario.
"""
from typing import List, Optional
from sqlmodel import Session, select
from app.interfaces.usuario_repo_if import IUsuarioRepository
from app.models.usuario import Usuario
from app.models.auth import AdminUserCreate, UserPermissionsUpdate, UserUpdate
from app.core.security import get_password_hash

class UsuarioRepository(IUsuarioRepository):
    """Repositorio para operaciones CRUD de Usuario"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_all(self) -> List[Usuario]:
        """Obtiene todos los usuarios"""
        statement = select(Usuario)
        return list(self.session.exec(statement).all())
    
    def get_by_id(self, user_id: int) -> Optional[Usuario]:
        """Obtiene un usuario por ID"""
        return self.session.get(Usuario, user_id)
    
    def get_by_username(self, username: str) -> Optional[Usuario]:
        """Obtiene un usuario por username"""
        statement = select(Usuario).where(Usuario.username == username)
        return self.session.exec(statement).first()
    
    def create(self, user_data: AdminUserCreate) -> Usuario:
        """Crea un nuevo usuario"""
        hashed_password = get_password_hash(user_data.password)
        
        db_user = Usuario(
            username=user_data.username,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            role=user_data.role,
            permissions=user_data.permissions.model_dump()
        )
        
        self.session.add(db_user)
        self.session.commit()
        self.session.refresh(db_user)
        return db_user
    
    def update(self, user_id: int, user_data: UserUpdate) -> Optional[Usuario]:
        """Actualiza un usuario"""
        db_user = self.get_by_id(user_id)
        if not db_user:
            return None
        
        update_data = user_data.model_dump(exclude_unset=True)
        
        # Si se actualizan permisos, convertir a dict si es un objeto Pydantic
        if "permissions" in update_data and update_data["permissions"]:
            # Verificar si es un objeto Pydantic (tiene model_dump) o ya es un dict
            if hasattr(update_data["permissions"], 'model_dump'):
                update_data["permissions"] = update_data["permissions"].model_dump()
            # Si ya es un dict, dejarlo como está
        
        for key, value in update_data.items():
            setattr(db_user, key, value)
        
        self.session.add(db_user)
        self.session.commit()
        self.session.refresh(db_user)
        return db_user
    
    def update_permissions(self, user_id: int, permissions_data: UserPermissionsUpdate) -> Optional[Usuario]:
        """Actualiza solo los permisos de un usuario"""
        db_user = self.get_by_id(user_id)
        if not db_user:
            return None
        
        db_user.permissions = permissions_data.permissions.model_dump()
        
        self.session.add(db_user)
        self.session.commit()
        self.session.refresh(db_user)
        return db_user
    
    def delete(self, user_id: int) -> bool:
        """Elimina un usuario. Retorna True si fue eliminado"""
        db_user = self.get_by_id(user_id)
        if not db_user:
            return False
        
        self.session.delete(db_user)
        self.session.commit()
        return True
