# app/repositories/ciclo_repo.py
"""
Implementación del repositorio de Ciclo Escolar.
"""
from typing import List, Optional
from sqlmodel import Session, select, update
from app.interfaces.ciclo_repo_if import ICicloRepository
from app.models.ciclo_escolar import CicloEscolar, CicloEscolarCreate, CicloEscolarUpdate

class CicloRepository(ICicloRepository):
    """Repositorio para operaciones CRUD de Ciclo Escolar"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_all(self) -> List[CicloEscolar]:
        """Obtiene todos los ciclos"""
        statement = select(CicloEscolar)
        return list(self.session.exec(statement).all())
    
    def get_by_id(self, ciclo_id: int) -> Optional[CicloEscolar]:
        """Obtiene un ciclo por ID"""
        return self.session.get(CicloEscolar, ciclo_id)
    
    def get_activo(self) -> Optional[CicloEscolar]:
        """Obtiene el ciclo activo actual"""
        statement = select(CicloEscolar).where(CicloEscolar.activo == True)
        return self.session.exec(statement).first()
    
    def get_by_nombre(self, nombre: str) -> Optional[CicloEscolar]:
        """Obtiene un ciclo por su nombre"""
        statement = select(CicloEscolar).where(CicloEscolar.nombre == nombre)
        return self.session.exec(statement).first()
    
    def create(self, ciclo_data: CicloEscolarCreate) -> CicloEscolar:
        """Crea un nuevo ciclo"""
        db_ciclo = CicloEscolar.model_validate(ciclo_data)
        self.session.add(db_ciclo)
        self.session.commit()
        self.session.refresh(db_ciclo)
        return db_ciclo
    
    def update(self, ciclo_id: int, ciclo_data: CicloEscolarUpdate) -> Optional[CicloEscolar]:
        """Actualiza un ciclo"""
        db_ciclo = self.get_by_id(ciclo_id)
        if not db_ciclo:
            return None
        
        update_data = ciclo_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_ciclo, key, value)
        
        self.session.add(db_ciclo)
        self.session.commit()
        self.session.refresh(db_ciclo)
        return db_ciclo
    
    def activar(self, ciclo_id: int) -> Optional[CicloEscolar]:
        """Activa un ciclo y desactiva los demás"""
        # Desactivar todos los ciclos
        statement = update(CicloEscolar).values(activo=False)
        self.session.exec(statement)
        
        # Activar el ciclo solicitado
        db_ciclo = self.get_by_id(ciclo_id)
        if not db_ciclo:
            self.session.rollback()
            return None
        
        db_ciclo.activo = True
        self.session.add(db_ciclo)
        self.session.commit()
        self.session.refresh(db_ciclo)
        return db_ciclo
    
    def delete(self, ciclo_id: int) -> bool:
        """Elimina un ciclo (CASCADE). Retorna True si fue eliminado"""
        db_ciclo = self.get_by_id(ciclo_id)
        if not db_ciclo:
            return False
        
        self.session.delete(db_ciclo)
        self.session.commit()
        return True
    
    def exists(self, ciclo_id: int) -> bool:
        """Verifica si existe un ciclo con ese ID"""
        return self.get_by_id(ciclo_id) is not None
