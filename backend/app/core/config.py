"""
Configuración centralizada de la aplicación
Maneja variables de entorno y constantes globales
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings
import pytz


from pydantic import Field

class Settings(BaseSettings):
    """Configuración de la aplicación usando variables de entorno"""
    
    # Database - Variables individuales
    POSTGRES_USER: str = "siae_admin"
    POSTGRES_PASSWORD: str = "admin123"
    POSTGRES_DB: str = "siae_db"
    POSTGRES_HOST: str = "localhost" # Changed default to localhost based on user input
    POSTGRES_PORT: int = 5432
    
    # Database URL
    # Prioridad: 1. Variable de entorno (Docker) 2. Construida desde variables (Local Postgres)
    # Usamos un alias para capturar la variable de entorno DATABASE_URL si existe
    DB_CONNECTION_STR: Optional[str] = Field(None, alias="DATABASE_URL")

    @property
    def DATABASE_URL(self) -> str:
        if self.DB_CONNECTION_STR:
            return self.DB_CONNECTION_STR
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 horas
    
    # Application
    APP_NAME: str = "SIAE"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Timezone
    TIMEZONE: str = "America/Mexico_City"
    
    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost",
        "https://siae.site",
        "http://localhost:80",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1",
        "http://127.0.0.1:80",
        "http://127.0.0.1:8000"
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignorar variables extra del .env


# Instancia global de configuración
settings = Settings()

# Zona horaria de México
MEXICO_TZ = pytz.timezone(settings.TIMEZONE)

# Exportar constantes individuales para compatibilidad
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
ALLOWED_ORIGINS = settings.ALLOWED_ORIGINS
