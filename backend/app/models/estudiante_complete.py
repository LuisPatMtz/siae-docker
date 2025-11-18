# app/models/estudiante_complete.py
"""
DTOs completos de Estudiante con relaciones.
Este archivo se importa después para evitar dependencias circulares.
"""
from typing import Optional
from app.models.estudiante import EstudianteRead
from app.models.grupo import GrupoRead
from app.models.ciclo_escolar import CicloEscolarRead
from app.models.nfc import NFCRead


class EstudianteReadComplete(EstudianteRead):
    """DTO para leer un estudiante con relaciones"""
    grupo: Optional[GrupoRead] = None
    ciclo: Optional[CicloEscolarRead] = None
    nfc: Optional[NFCRead] = None
