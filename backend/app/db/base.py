# app/db/base.py
"""
Importa todos los modelos para que SQLModel pueda crear las tablas.
Este archivo debe importarse antes de llamar create_db_and_tables().
"""
from sqlmodel import SQLModel

# Importar todos los modelos para registrarlos en SQLModel.metadata
from app.models.ciclo_escolar import CicloEscolar
from app.models.grupo import Grupo
from app.models.usuario import Usuario
from app.models.estudiante import Estudiante
from app.models.nfc import NFC
from app.models.asistencia import Asistencia
from app.models.alerta import Alerta
from app.models.falta import Falta
from app.models.acceso import Acceso

# Esta variable no se usa directamente, pero asegura que todos los modelos estén importados
__all__ = [
    "CicloEscolar",
    "Grupo",
    "Usuario",
    "Estudiante",
    "NFC",
    "Asistencia",
    "Alerta",
    "Falta",
    "Acceso",
]
