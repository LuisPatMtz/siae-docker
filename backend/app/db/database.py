# app/db/database.py
"""
Configuración de la base de datos y sesiones.
"""
from sqlmodel import create_engine, Session, SQLModel, text
from app.core.config import settings

# Engine con configuraciones para PostgreSQL
engine = create_engine(
    settings.DATABASE_URL,
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
