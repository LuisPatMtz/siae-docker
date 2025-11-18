# app/models/utils.py
"""
Utilidades compartidas para los modelos.
"""
from datetime import datetime
from app.core.config import MEXICO_TZ

def get_mexico_time():
    """Retorna la hora actual en la zona horaria de México sin timezone info"""
    return datetime.now(MEXICO_TZ).replace(tzinfo=None)
