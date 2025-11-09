# app/dependencies.py
from typing import Optional
from datetime import date

def get_query_date(fecha: Optional[date] = None) -> date:
    """Dependencia para obtener la fecha de la consulta, o hoy si es None."""
    return fecha if fecha else date.today()