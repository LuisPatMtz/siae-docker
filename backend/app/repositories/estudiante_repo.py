# app/repositories/estudiante_repo.py
"""
Implementación del repositorio de Estudiante.
"""
from typing import List, Optional
from sqlmodel import Session, select, update
from sqlalchemy.orm import selectinload
from app.interfaces.estudiante_repo_if import IEstudianteRepository
from app.models.estudiante import Estudiante, EstudianteCreate, EstudianteUpdate

class EstudianteRepository(IEstudianteRepository):
    """Repositorio para operaciones CRUD de Estudiante"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_all(self) -> List[Estudiante]:
        """Obtiene todos los estudiantes (sin relaciones)"""
        statement = select(Estudiante)
        return list(self.session.exec(statement).all())
    
    def get_all_complete(self) -> List[Estudiante]:
        """Obtiene todos los estudiantes con relaciones (grupo, ciclo, nfc)"""
        statement = select(Estudiante).options(
            selectinload(Estudiante.grupo),
            selectinload(Estudiante.ciclo),
            selectinload(Estudiante.nfc)
        )
        return list(self.session.exec(statement).all())
    
    def get_by_matricula(self, matricula: str) -> Optional[Estudiante]:
        """Obtiene un estudiante por matrícula"""
        return self.session.get(Estudiante, matricula)
    
    def get_by_grupo(self, grupo_id: int) -> List[Estudiante]:
        """Obtiene estudiantes de un grupo"""
        statement = select(Estudiante).where(Estudiante.id_grupo == grupo_id)
        return list(self.session.exec(statement).all())
    
    def get_by_ciclo(self, ciclo_id: int) -> List[Estudiante]:
        """Obtiene estudiantes de un ciclo"""
        statement = select(Estudiante).where(Estudiante.id_ciclo == ciclo_id)
        return list(self.session.exec(statement).all())
    
    def create(self, estudiante_data: EstudianteCreate) -> Estudiante:
        """Crea un nuevo estudiante"""
        db_estudiante = Estudiante.model_validate(estudiante_data)
        self.session.add(db_estudiante)
        self.session.commit()
        self.session.refresh(db_estudiante)
        return db_estudiante
    
    def update(self, matricula: str, estudiante_data: EstudianteUpdate) -> Optional[Estudiante]:
        """Actualiza un estudiante"""
        db_estudiante = self.get_by_matricula(matricula)
        if not db_estudiante:
            return None
        
        update_data = estudiante_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_estudiante, key, value)
        
        self.session.add(db_estudiante)
        self.session.commit()
        self.session.refresh(db_estudiante)
        return db_estudiante
    
    def bulk_move_grupo(self, matriculas: List[str], nuevo_id_grupo: int) -> int:
        """Mueve múltiples estudiantes a un nuevo grupo. Retorna cantidad actualizada"""
        statement = (
            update(Estudiante)
            .where(Estudiante.matricula.in_(matriculas))
            .values(id_grupo=nuevo_id_grupo)
        )
        result = self.session.exec(statement)
        self.session.commit()
        return result.rowcount
    
    def delete(self, matricula: str) -> bool:
        """Elimina un estudiante (CASCADE). Retorna True si fue eliminado"""
        db_estudiante = self.get_by_matricula(matricula)
        if not db_estudiante:
            return False
        
        self.session.delete(db_estudiante)
        self.session.commit()
        return True
    
    def exists(self, matricula: str) -> bool:
        """Verifica si existe un estudiante con esa matrícula"""
        return self.get_by_matricula(matricula) is not None
