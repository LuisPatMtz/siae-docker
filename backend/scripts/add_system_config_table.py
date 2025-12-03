"""
Script para crear la tabla system_config y agregar configuraciones iniciales.
"""
from sqlmodel import Session, select, text
from app.db.database import engine
from app.models.system_config import SystemConfig
from datetime import datetime

def create_system_config_table():
    """Crea la tabla system_config si no existe."""
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS system_config (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) NOT NULL UNIQUE,
        value VARCHAR(500) NOT NULL,
        description TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);
    """
    
    with engine.begin() as conn:
        conn.execute(text(create_table_sql))
        print("✓ Tabla system_config creada exitosamente")


def initialize_default_configs():
    """Inicializa configuraciones por defecto."""
    default_configs = [
        {
            "key": "exit_time_window_minutes",
            "value": "240",
            "description": "Ventana de tiempo en minutos después de una entrada para registrar una salida (por defecto 4 horas)"
        },
        {
            "key": "alert_auto_close_days",
            "value": "7",
            "description": "Días después de los cuales una alerta resuelta se marca como cerrada automáticamente"
        },
        {
            "key": "max_justification_file_size_mb",
            "value": "5",
            "description": "Tamaño máximo de archivos adjuntos en justificaciones (en MB)"
        }
    ]
    
    with Session(engine) as session:
        for config_data in default_configs:
            # Verificar si ya existe
            existing = session.exec(
                select(SystemConfig).where(SystemConfig.key == config_data["key"])
            ).first()
            
            if not existing:
                config = SystemConfig(
                    key=config_data["key"],
                    value=config_data["value"],
                    description=config_data["description"]
                )
                session.add(config)
                print(f"✓ Configuración '{config_data['key']}' inicializada con valor: {config_data['value']}")
            else:
                print(f"→ Configuración '{config_data['key']}' ya existe, omitiendo...")
        
        session.commit()
        print("✓ Configuraciones inicializadas correctamente")


if __name__ == "__main__":
    print("=== Iniciando migración de System Config ===")
    
    try:
        # Crear tabla
        create_system_config_table()
        
        # Inicializar configuraciones por defecto
        initialize_default_configs()
        
        print("\n=== Migración completada exitosamente ===")
        
    except Exception as e:
        print(f"\n✗ Error durante la migración: {e}")
        raise
