# app/repositories/grupo_repo.py
"""
Implementación del repositorio de Grupo.
"""
from typing import List, Optional
from sqlmodel import Session, select
from app.interfaces.grupo_repo_if import IGrupoRepository
from app.models.grupo import Grupo, GrupoCreate, GrupoUpdate

class GrupoRepository(IGrupoRepository):
    """Repositorio para operaciones CRUD de Grupo"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_all(self) -> List[Grupo]:
        """Obtiene todos los grupos"""
        statement = select(Grupo)
        return list(self.session.exec(statement).all())
    
    def get_by_id(self, grupo_id: int) -> Optional[Grupo]:
        """Obtiene un grupo por ID"""
        return self.session.get(Grupo, grupo_id)
    
    def get_by_nombre(self, nombre: str) -> Optional[Grupo]:
        """Obtiene un grupo por nombre"""
        statement = select(Grupo).where(Grupo.nombre == nombre)
        return self.session.exec(statement).first()
    
    def get_by_turno(self, turno: str) -> List[Grupo]:
        """Obtiene grupos de un turno específico"""
        statement = select(Grupo).where(Grupo.turno == turno)
        return list(self.session.exec(statement).all())
    
    def create(self, grupo_data: GrupoCreate) -> Grupo:
        """Crea un nuevo grupo"""
        db_grupo = Grupo.model_validate(grupo_data)
        self.session.add(db_grupo)
        self.session.commit()
        self.session.refresh(db_grupo)
        return db_grupo
    
    def update(self, grupo_id: int, grupo_data: GrupoUpdate) -> Optional[Grupo]:
        """Actualiza un grupo"""
        db_grupo = self.get_by_id(grupo_id)
        if not db_grupo:
            return None
        
        update_data = grupo_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_grupo, key, value)
        
        self.session.add(db_grupo)
        self.session.commit()
        self.session.refresh(db_grupo)
        return db_grupo
    
    def delete(self, grupo_id: int) -> bool:
        """Elimina un grupo. Retorna True si fue eliminado"""
        db_grupo = self.get_by_id(grupo_id)
        if not db_grupo:
            return False
        
        self.session.delete(db_grupo)
        self.session.commit()
        return True
    
    def exists(self, grupo_id: int) -> bool:
        """Verifica si existe un grupo con ese ID"""
        return self.get_by_id(grupo_id) is not None
