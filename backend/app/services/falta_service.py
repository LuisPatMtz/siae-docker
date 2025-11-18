# app/services/falta_service.py
"""
Servicio de lógica de negocio para Faltas.
"""
from typing import List, Optional
from datetime import date
from sqlmodel import Session
from fastapi import HTTPException, status

from app.models import Falta, FaltaCreate, FaltaUpdate, Estudiante, CicloEscolar
from app.repositories.falta_repo import FaltaRepository


class FaltaService:
    """Servicio para gestionar faltas"""
    
    def __init__(self, session: Session):
        self.session = session
        self.falta_repo = FaltaRepository(session)
    
    def registrar_falta(self, falta_data: FaltaCreate) -> Falta:
        """
        Registra una falta para un estudiante.
        Valida:
        - Que el estudiante exista
        - Que el ciclo exista
        - Que no haya ya una falta en esa fecha
        """
        # Verificar que el estudiante existe
        estudiante = self.session.get(Estudiante, falta_data.matricula_estudiante)
        if not estudiante:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Estudiante con matrícula {falta_data.matricula_estudiante} no encontrado."
            )
        
        # Verificar que el ciclo existe
        ciclo = self.session.get(CicloEscolar, falta_data.id_ciclo)
        if not ciclo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ciclo escolar con ID {falta_data.id_ciclo} no encontrado."
            )
        
        # Verificar que no existe ya una falta para este estudiante en esta fecha
        if self.falta_repo.exists_falta(falta_data.matricula_estudiante, falta_data.fecha):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un registro de falta para el estudiante {falta_data.matricula_estudiante} en la fecha {falta_data.fecha}."
            )
        
        return self.falta_repo.create(falta_data)
    
    def obtener_faltas(
        self,
        matricula_estudiante: Optional[str] = None,
        id_ciclo: Optional[int] = None,
        fecha: Optional[date] = None,
        estado: Optional[str] = None
    ) -> List[Falta]:
        """Obtiene faltas con filtros opcionales"""
        return self.falta_repo.get_filtered(
            matricula=matricula_estudiante,
            id_ciclo=id_ciclo,
            fecha=fecha,
            estado=estado
        )
    
    def obtener_faltas_por_estudiante(
        self, 
        matricula: str, 
        id_ciclo: Optional[int] = None
    ) -> List[Falta]:
        """Obtiene todas las faltas de un estudiante"""
        # Verificar que el estudiante existe
        estudiante = self.session.get(Estudiante, matricula)
        if not estudiante:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Estudiante con matrícula {matricula} no encontrado."
            )
        
        return self.falta_repo.get_by_matricula(matricula, id_ciclo)
    
    def obtener_faltas_por_fecha(
        self, 
        fecha: date, 
        id_ciclo: Optional[int] = None
    ) -> List[Falta]:
        """Obtiene todas las faltas de una fecha"""
        return self.falta_repo.get_by_fecha(fecha, id_ciclo)
    
    def obtener_falta_por_id(self, id_falta: int) -> Falta:
        """Obtiene una falta específica por su ID"""
        falta = self.falta_repo.get_by_id(id_falta)
        if not falta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Falta con ID {id_falta} no encontrada."
            )
        return falta
    
    def actualizar_falta(self, id_falta: int, falta_update: FaltaUpdate) -> Falta:
        """Actualiza una falta existente"""
        falta = self.falta_repo.update(id_falta, falta_update)
        if not falta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Falta con ID {id_falta} no encontrada."
            )
        return falta
    
    def justificar_falta(self, id_falta: int, justificacion: str) -> Falta:
        """Justifica una falta específica"""
        falta = self.falta_repo.justificar(id_falta, justificacion)
        if not falta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Falta con ID {id_falta} no encontrada."
            )
        return falta
    
    def eliminar_falta(self, id_falta: int) -> None:
        """Elimina una falta"""
        if not self.falta_repo.delete(id_falta):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Falta con ID {id_falta} no encontrada."
            )
