# app/api/v1/__init__.py
"""
API v1 - Routers de endpoints.
"""
from app.api.v1.auth_routes import router as auth_router
from app.api.v1.users_routes import router as users_router
from app.api.v1.estudiantes_routes import router as estudiantes_router
from app.api.v1.grupos_routes import router as grupos_router
from app.api.v1.ciclos_routes import router as ciclos_router
from app.api.v1.dashboard_routes import router as dashboard_router
from app.api.v1.acceso_routes import router as acceso_router
from app.api.v1.tarjetas_routes import router as tarjetas_router
from app.api.v1.faltas_routes import router as faltas_router

__all__ = [
    "auth_router",
    "users_router",
    "estudiantes_router",
    "grupos_router",
    "ciclos_router",
    "dashboard_router",
    "acceso_router",
    "tarjetas_router",
    "faltas_router",
]
