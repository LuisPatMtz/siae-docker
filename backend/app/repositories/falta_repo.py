# app/repositories/falta_repo.py
"""
Implementación del repositorio de Faltas.
"""
from typing import List, Optional
from datetime import date
from sqlmodel import Session, select
from app.models import Falta, FaltaCreate, FaltaUpdate
from app.interfaces.falta_repo_if import IFaltaRepository


class FaltaRepository(IFaltaRepository):
    """Repositorio para gestionar faltas"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_all(self) -> List[Falta]:
        """Obtiene todas las faltas ordenadas por fecha descendente"""
        statement = select(Falta).order_by(Falta.fecha.desc())
        return list(self.session.exec(statement).all())
    
    def get_by_id(self, id_falta: int) -> Optional[Falta]:
        """Obtiene una falta por ID"""
        return self.session.get(Falta, id_falta)
    
    def get_by_matricula(self, matricula: str, id_ciclo: Optional[int] = None) -> List[Falta]:
        """Obtiene todas las faltas de un estudiante"""
        statement = select(Falta).where(Falta.matricula_estudiante == matricula)
        
        if id_ciclo:
            statement = statement.where(Falta.id_ciclo == id_ciclo)
        
        statement = statement.order_by(Falta.fecha.desc())
        return list(self.session.exec(statement).all())
    
    def get_by_fecha(self, fecha: date, id_ciclo: Optional[int] = None) -> List[Falta]:
        """Obtiene todas las faltas de una fecha"""
        statement = select(Falta).where(Falta.fecha == fecha)
        
        if id_ciclo:
            statement = statement.where(Falta.id_ciclo == id_ciclo)
        
        statement = statement.order_by(Falta.matricula_estudiante)
        return list(self.session.exec(statement).all())
    
    def get_filtered(
        self, 
        matricula: Optional[str] = None,
        id_ciclo: Optional[int] = None,
        fecha: Optional[date] = None,
        estado: Optional[str] = None
    ) -> List[Falta]:
        """Obtiene faltas con filtros opcionales"""
        statement = select(Falta)
        
        if matricula:
            statement = statement.where(Falta.matricula_estudiante == matricula)
        
        if id_ciclo:
            statement = statement.where(Falta.id_ciclo == id_ciclo)
        
        if fecha:
            statement = statement.where(Falta.fecha == fecha)
        
        if estado:
            statement = statement.where(Falta.estado == estado)
        
        statement = statement.order_by(Falta.fecha.desc())
        return list(self.session.exec(statement).all())
    
    def exists_falta(self, matricula: str, fecha: date) -> bool:
        """Verifica si ya existe una falta para este estudiante en esta fecha"""
        statement = select(Falta).where(
            Falta.matricula_estudiante == matricula,
            Falta.fecha == fecha
        )
        return self.session.exec(statement).first() is not None
    
    def create(self, falta_data: FaltaCreate) -> Falta:
        """Crea una nueva falta"""
        db_falta = Falta.model_validate(falta_data)
        self.session.add(db_falta)
        self.session.commit()
        self.session.refresh(db_falta)
        return db_falta
    
    def update(self, id_falta: int, falta_data: FaltaUpdate) -> Optional[Falta]:
        """Actualiza una falta existente"""
        db_falta = self.get_by_id(id_falta)
        if not db_falta:
            return None
        
        update_data = falta_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_falta, field, value)
        
        self.session.add(db_falta)
        self.session.commit()
        self.session.refresh(db_falta)
        return db_falta
    
    def justificar(self, id_falta: int, justificacion: str) -> Optional[Falta]:
        """Justifica una falta"""
        db_falta = self.get_by_id(id_falta)
        if not db_falta:
            return None
        
        db_falta.estado = "Justificado"
        db_falta.justificacion = justificacion
        
        self.session.add(db_falta)
        self.session.commit()
        self.session.refresh(db_falta)
        return db_falta
    
    def delete(self, id_falta: int) -> bool:
        """Elimina una falta. Retorna True si existía"""
        db_falta = self.get_by_id(id_falta)
        if not db_falta:
            return False
        
        self.session.delete(db_falta)
        self.session.commit()
        return True
