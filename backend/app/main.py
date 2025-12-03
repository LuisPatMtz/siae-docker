# app/main.py
"""
Aplicación principal FastAPI para el Sistema SIAE.
"""
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from datetime import date

# Importar base para registrar modelos
from app.db import base  # noqa: F401
from app.db.database import create_db_and_tables
from app.core.config import ALLOWED_ORIGINS
from app.core.logging import LoggingMiddleware, api_logger

# Importar routers
from app.api.v1 import (
    auth_router,
    users_router,
    estudiantes_router,
    grupos_router,
    ciclos_router,
    dashboard_router,

    tarjetas_router,
    faltas_router,
    asistencia_router,
    justificaciones_router,
    maintenance_router,
    system_config_router,
    reset_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Función que se ejecuta al iniciar la API.
    Crea todas las tablas definidas en models si no existen.
    """
    api_logger.info("=== Iniciando SIAE API ===")
    api_logger.info("Creando tablas de base de datos si no existen...")
    create_db_and_tables()
    api_logger.info("Base de datos inicializada correctamente")
    
    # Inicializar scheduler para tareas automáticas
    api_logger.info("Inicializando scheduler de tareas automáticas...")
    from app.services.scheduler_service import scheduler_service
    scheduler_service.load_schedules_from_db()
    api_logger.info("Scheduler inicializado correctamente")
    
    api_logger.info("Sistema iniciado. Base de datos lista para configuración inicial.")
        
    yield
    
    # Detener scheduler al cerrar la aplicación
    api_logger.info("Deteniendo scheduler...")
    scheduler_service.shutdown()
    api_logger.info("=== Apagando SIAE API ===")


# Inicializa la aplicación FastAPI
app = FastAPI(
    lifespan=lifespan,
    title="SIAE API",
    description="Sistema Inteligente de Asistencia Estudiantil",
    version="2.0.0",
    redirect_slashes=False  # Evitar redirecciones automáticas por trailing slashes
)


# --- Configuración de CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Middleware de Logging ---
app.add_middleware(LoggingMiddleware)


# === REGISTRAR ROUTERS ===
# Registrar todos los routers con prefijo /api
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(estudiantes_router, prefix="/api")
app.include_router(grupos_router, prefix="/api")
app.include_router(ciclos_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")

app.include_router(tarjetas_router, prefix="/api")
app.include_router(faltas_router, prefix="/api")
app.include_router(asistencia_router, prefix="/api")
app.include_router(justificaciones_router, prefix="/api")
app.include_router(maintenance_router, prefix="/api")
app.include_router(system_config_router, prefix="/api")
app.include_router(reset_router, prefix="/api")


@app.get("/")
def read_root():
    """Endpoint raíz de bienvenida."""
    return {
        "message": "Bienvenido a la API del SIAE",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Endpoint de health check."""
    return {"status": "healthy"}
