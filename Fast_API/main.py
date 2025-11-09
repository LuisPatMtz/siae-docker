# app/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

# Importamos los endpoints a la app y la base de datos para crear las tablas
from database import create_db_and_tables
# Importa todos los routers
from routers import (
    estudiantes, 
    acceso, 
    dashboard, 
    auth, 
    users, 
    tarjetas,
    grupos,
    ciclos,
    faltas
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Función que se ejecuta al iniciar la API.
    Crea todas las tablas definidas en models.py si no existen.
    """
    print("Iniciando: Creando tablas si no existen...")
    create_db_and_tables()
    yield
    print("Apagando...")

# Inicializa la aplicación FastAPI con el lifespan
app = FastAPI(
    lifespan=lifespan,
    title="SIAE API",
    description="Sistema Inteligente de Asistencia Estudiantil"
)

# --- Configuración de CORS ---
# Permite que el frontend React (ej. http://localhost:5173) 
# se comunique con esta API (ej. http://127.0.0.1:8000).
origins = [
    "http://localhost:5173", # Origen de tu app React (Vite)
    "http://localhost:3000", # Origen común para create-react-app
    "*"  # Permitir todos los orígenes (para desarrollo)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Permite estos orígenes
    allow_credentials=True,    # Permite cookies/headers de autorización
    allow_methods=["*"],       # Permite todos los métodos (GET, POST, PATCH, etc.)
    allow_headers=["*"],       # Permite todos los headers
)

# === INCLUYE LOS ROUTERS ===
# Registra todos los endpoints en la aplicación principal

app.include_router(auth.router)        # Para login (/login, /users/me)
app.include_router(users.router)       # Para gestión de usuarios (/users)
app.include_router(estudiantes.router) # Para gestión de estudiantes (/estudiantes)
app.include_router(grupos.router)      # Para gestión de grupos (/grupos)
app.include_router(ciclos.router)      # Para gestión de ciclos escolares (/ciclos)
app.include_router(dashboard.router)   # Para datos del dashboard (/dashboard)
app.include_router(acceso.router)      # Para el registro de acceso NFC (/acceso, /nfc)
app.include_router(tarjetas.router)    # Para vincular tarjetas NFC (/nfc)
app.include_router(faltas.router)      # Para gestión de faltas (/faltas)

@app.get("/")
def read_root():
    """Endpoint raíz de bienvenida."""
    return {"Bienvenido": "API del SIAE"}