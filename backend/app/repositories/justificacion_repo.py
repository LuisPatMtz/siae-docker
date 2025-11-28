# app/repositories/justificacion_repo.py
"""
Implementación del repositorio de Justificaciones.
"""
from typing import List, Optional
from sqlmodel import Session, select
from app.models.justificacion import Justificacion, JustificacionCreate
from app.interfaces.justificacion_repo_if import IJustificacionRepository


class JustificacionRepository(IJustificacionRepository):
    """Repositorio para gestionar justificaciones"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_all(self) -> List[Justificacion]:
        """Obtiene todas las justificaciones ordenadas por fecha descendente"""
        statement = select(Justificacion).order_by(Justificacion.fecha_creacion.desc())
        return list(self.session.exec(statement).all())
    
    def get_by_id(self, id_justificacion: int) -> Optional[Justificacion]:
        """Obtiene una justificación por ID"""
        return self.session.get(Justificacion, id_justificacion)
    
    def create(self, justificacion_data: JustificacionCreate) -> Justificacion:
        """Crea una nueva justificación"""
        db_justificacion = Justificacion.model_validate(justificacion_data)
        self.session.add(db_justificacion)
        self.session.commit()
        self.session.refresh(db_justificacion)
        return db_justificacion
    
    def delete(self, id_justificacion: int) -> bool:
        """Elimina una justificación"""
        db_justificacion = self.get_by_id(id_justificacion)
        if not db_justificacion:
            return False
        
        self.session.delete(db_justificacion)
        self.session.commit()
        return True
