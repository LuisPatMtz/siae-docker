# app/models/system_config.py
"""
Modelo para configuración del sistema.
Almacena parámetros configurables en tiempo de ejecución.
"""
from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime


class SystemConfig(SQLModel, table=True):
    """Configuración del sistema"""
    __tablename__ = "system_config"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(unique=True, index=True, max_length=100)
    value: str = Field(max_length=500)
    description: Optional[str] = Field(default=None, max_length=500)
    updated_at: Optional[datetime] = Field(default=None)


class SystemConfigRead(SQLModel):
    """DTO para leer configuración"""
    id: int
    key: str
    value: str
    description: Optional[str] = None
    updated_at: Optional[datetime] = None


class SystemConfigUpdate(SQLModel):
    """DTO para actualizar configuración"""
    value: str
