# app/services/justificacion_service.py
"""
Servicio de lógica de negocio para Justificaciones.
"""
from typing import List
from app.models.justificacion import Justificacion, JustificacionCreate
from app.interfaces.justificacion_repo_if import IJustificacionRepository


class JustificacionService:
    """Servicio para manejar la lógica de justificaciones"""
    
    def __init__(self, justificacion_repo: IJustificacionRepository):
        self.justificacion_repo = justificacion_repo
    
    def crear_justificacion(self, justificacion_data: JustificacionCreate) -> Justificacion:
        """
        Crea una nueva justificación.
        Esta justificación podrá ser vinculada a múltiples faltas.
        """
        return self.justificacion_repo.create(justificacion_data)
    
    def obtener_todas_justificaciones(self) -> List[Justificacion]:
        """Obtiene todas las justificaciones"""
        return self.justificacion_repo.get_all()
    
    def obtener_justificacion(self, id_justificacion: int) -> Justificacion:
        """Obtiene una justificación por ID"""
        justificacion = self.justificacion_repo.get_by_id(id_justificacion)
        if not justificacion:
            raise ValueError(f"Justificación con ID {id_justificacion} no encontrada")
        return justificacion
    
    def eliminar_justificacion(self, id_justificacion: int) -> bool:
        """Elimina una justificación"""
        return self.justificacion_repo.delete(id_justificacion)
