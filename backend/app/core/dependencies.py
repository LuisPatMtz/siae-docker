"""
Dependencias globales de la aplicación
Proporciona Session de DB y usuario actual autenticado
"""
from typing import Annotated, Optional
from datetime import date
from fastapi import Depends
from sqlmodel import Session

from app.core.security import get_current_username
from app.db.database import get_session


# Tipo anotado para Session de DB (reutilizable)
SessionDep = Annotated[Session, Depends(get_session)]

# Tipo anotado para username actual (del token JWT)
CurrentUsername = Annotated[str, Depends(get_current_username)]


def get_query_date(fecha: Optional[date] = None) -> date:
    """Dependencia para obtener la fecha de la consulta, o hoy si es None."""
    return fecha if fecha else date.today()
