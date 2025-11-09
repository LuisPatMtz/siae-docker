from sqlmodel import create_engine, Session, SQLModel, text
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Primero intentar leer DATABASE_URL directamente (para Docker)
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Si DATABASE_URL está definida (caso Docker), usarla directamente
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    print(f"Usando DATABASE_URL: {DATABASE_URL}")
else:
    # Si no, construir desde variables individuales (desarrollo local)
    DB_USER = os.getenv("DB_USER", "siae_admin")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "admin123")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "siae_db")
    
    SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    print(f"Usando variables individuales para DB")

# Engine con configuraciones para PostgreSQL
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    echo=True,  # Para ver las queries SQL en consola
    pool_pre_ping=True,  # Verificar conexiones antes de usarlas
    pool_recycle=3600  # Reciclar conexiones cada hora
)

def create_db_and_tables():
    """Crea todas las tablas en la base de datos."""
    print("Creando tablas si no existen...")
    try:
        SQLModel.metadata.create_all(engine)
        print("✓ TABLAS CREADAS EXITOSAMENTE")
    except Exception as e:
        print(f"✗ ERROR AL CREAR TABLAS: {e}")
        raise

def get_session():
    """Dependencia de FastAPI para obtener una sesión de DB."""
    with Session(engine) as session:
        yield session

def test_connection():
    """Función para probar la conexión a la base de datos"""
    try:
        with Session(engine) as session:
            result = session.exec(text("SELECT current_database(), current_schema(), current_user;"))
            db_info = result.first()
            print("CONEXION EXITOSA:")
            print(f"   Base de datos: {db_info[0]}")
            print(f"   Esquema actual: {db_info[1]}")
            print(f"   Usuario: {db_info[2]}")
            return True
    except Exception as e:
        print(f"ERROR DE CONEXION: {e}")
        return False