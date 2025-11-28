# app/main.py
"""
Aplicación principal FastAPI para el Sistema SIAE.
"""
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

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
    maintenance_router
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
    
    # Inicializar datos de prueba si es necesario
    from sqlmodel import Session, select
    from app.db.database import engine
    from app.models import Usuario, CicloEscolar, Grupo, Estudiante
    from app.core.security import get_password_hash
    
    try:
        with Session(engine) as session:
            # 1. Crear Usuario Admin
            admin = session.exec(select(Usuario).where(Usuario.username == "admin")).first()
            if not admin:
                api_logger.info("Creando usuario admin por defecto...")
                admin = Usuario(
                    username="admin",
                    hashed_password=get_password_hash("admin123"),
                    full_name="Administrador Sistema",
                    role="Admin",
                    permissions={"all": True}
                )
                session.add(admin)
                session.commit()
                api_logger.info("Usuario admin creado.")
            
            # 2. Crear Ciclo Escolar
            ciclo = session.exec(select(CicloEscolar).where(CicloEscolar.nombre == "2025-A")).first()
            if not ciclo:
                ciclo = CicloEscolar(nombre="2025-A", activo=True)
                session.add(ciclo)
                session.commit()
                session.refresh(ciclo)
            
            # 3. Crear Grupo
            grupo = session.exec(select(Grupo).where(Grupo.nombre == "1-A")).first()
            if not grupo:
                grupo = Grupo(nombre="1-A", semestre=1, turno="matutino")
                session.add(grupo)
                session.commit()
                session.refresh(grupo)
                
            # 4. Crear Estudiante de Prueba
            matricula = "2025002"
            estudiante = session.get(Estudiante, matricula)
            if not estudiante:
                estudiante = Estudiante(
                    matricula=matricula,
                    nombre="Juan Carlos",
                    apellido="Perez Roldan",
                    id_grupo=grupo.id,
                    id_ciclo=ciclo.id
                )
                session.add(estudiante)
                session.commit()
                api_logger.info(f"Estudiante de prueba creado: {matricula}")
                
    except Exception as e:
        api_logger.error(f"Error al inicializar datos: {e}")
        
    yield
    api_logger.info("=== Apagando SIAE API ===")


# Inicializa la aplicación FastAPI
app = FastAPI(
    lifespan=lifespan,
    title="SIAE API",
    description="Sistema Inteligente de Asistencia Estudiantil",
    version="2.0.0"
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
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(estudiantes_router)
app.include_router(grupos_router)
app.include_router(ciclos_router)
app.include_router(dashboard_router)

app.include_router(tarjetas_router)
app.include_router(faltas_router)
app.include_router(asistencia_router)
app.include_router(justificaciones_router)
app.include_router(maintenance_router)


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
