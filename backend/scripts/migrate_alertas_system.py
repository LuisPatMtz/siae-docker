"""
Script de migración para actualizar tablas de alertas y faltas.
Ejecutar con: python scripts/migrate_alertas_system.py
"""
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, text
from app.db.database import engine

def migrate_alertas():
    """Migra las tablas de alertas y faltas al nuevo sistema"""
    
    print("Iniciando migración del sistema de alertas...")
    
    with Session(engine) as session:
        try:
            # 1. Crear tabla de historial de alertas
            print("Creando tabla alertas_historial...")
            session.exec(text("""
                CREATE TABLE IF NOT EXISTS alertas_historial (
                    id SERIAL PRIMARY KEY,
                    id_alerta INTEGER NOT NULL REFERENCES alertas(id) ON DELETE CASCADE,
                    accion VARCHAR(100) NOT NULL,
                    descripcion TEXT NOT NULL,
                    cantidad_faltas_momento INTEGER NOT NULL DEFAULT 0,
                    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    usuario VARCHAR(100)
                )
            """))
            
            # 2. Modificar tabla alertas
            print("Actualizando tabla alertas...")
            
            # Renombrar columna fecha a fecha_creacion si existe
            session.exec(text("""
                ALTER TABLE alertas 
                RENAME COLUMN fecha TO fecha_creacion
            """))
            
            # Agregar nuevas columnas a alertas
            session.exec(text("""
                ALTER TABLE alertas
                ADD COLUMN IF NOT EXISTS fecha_modificacion TIMESTAMP,
                ADD COLUMN IF NOT EXISTS cantidad_faltas INTEGER DEFAULT 0,
                ADD COLUMN IF NOT EXISTS justificacion TEXT,
                ADD COLUMN IF NOT EXISTS fecha_justificacion DATE
            """))
            
            # Actualizar estados existentes
            session.exec(text("""
                UPDATE alertas 
                SET estado = 'Activa' 
                WHERE estado NOT IN ('Activa', 'Justificada', 'Cerrada')
            """))
            
            # 3. Modificar tabla faltas
            print("Actualizando tabla faltas...")
            
            # Renombrar columna estado si tiene valores antiguos
            session.exec(text("""
                UPDATE faltas 
                SET estado = 'Sin justificar' 
                WHERE estado = 'Ausente' OR estado NOT IN ('Sin justificar', 'Justificada')
            """))
            
            # Agregar nuevas columnas a faltas
            session.exec(text("""
                ALTER TABLE faltas
                ADD COLUMN IF NOT EXISTS fecha_justificacion DATE,
                ADD COLUMN IF NOT EXISTS id_alerta_asociada INTEGER REFERENCES alertas(id) ON DELETE SET NULL
            """))
            
            # 4. Crear índices para mejorar rendimiento
            print("Creando índices...")
            session.exec(text("""
                CREATE INDEX IF NOT EXISTS idx_alertas_matricula_estado 
                ON alertas(matricula_estudiante, estado)
            """))
            
            session.exec(text("""
                CREATE INDEX IF NOT EXISTS idx_alertas_historial_alerta 
                ON alertas_historial(id_alerta)
            """))
            
            session.exec(text("""
                CREATE INDEX IF NOT EXISTS idx_faltas_matricula_estado 
                ON faltas(matricula_estudiante, estado)
            """))
            
            session.exec(text("""
                CREATE INDEX IF NOT EXISTS idx_faltas_alerta 
                ON faltas(id_alerta_asociada)
            """))
            
            # 5. Crear registros de historial para alertas existentes
            print("Creando historial para alertas existentes...")
            session.exec(text("""
                INSERT INTO alertas_historial (id_alerta, accion, descripcion, cantidad_faltas_momento, fecha)
                SELECT 
                    id, 
                    'Creada', 
                    'Migración automática - Alerta existente', 
                    COALESCE(cantidad_faltas, 0),
                    fecha_creacion
                FROM alertas
                WHERE id NOT IN (SELECT DISTINCT id_alerta FROM alertas_historial)
            """))
            
            session.commit()
            print("✓ Migración completada exitosamente")
            
        except Exception as e:
            session.rollback()
            print(f"✗ Error durante la migración: {e}")
            import traceback
            traceback.print_exc()
            raise

def rollback_migration():
    """Revierte los cambios de la migración (usar con precaución)"""
    print("Revirtiendo migración...")
    
    with Session(engine) as session:
        try:
            # Eliminar tabla de historial
            session.exec(text("DROP TABLE IF EXISTS alertas_historial CASCADE"))
            
            # Eliminar columnas agregadas (PostgreSQL no soporta DROP COLUMN IF EXISTS en una sola línea)
            session.exec(text("""
                ALTER TABLE alertas
                DROP COLUMN IF EXISTS fecha_modificacion,
                DROP COLUMN IF EXISTS cantidad_faltas,
                DROP COLUMN IF EXISTS justificacion,
                DROP COLUMN IF EXISTS fecha_justificacion
            """))
            
            session.exec(text("""
                ALTER TABLE faltas
                DROP COLUMN IF EXISTS fecha_justificacion,
                DROP COLUMN IF EXISTS id_alerta_asociada
            """))
            
            # Renombrar fecha_creacion de vuelta a fecha
            session.exec(text("""
                ALTER TABLE alertas 
                RENAME COLUMN fecha_creacion TO fecha
            """))
            
            session.commit()
            print("✓ Rollback completado")
            
        except Exception as e:
            session.rollback()
            print(f"✗ Error durante rollback: {e}")
            raise

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Migración del sistema de alertas")
    parser.add_argument(
        '--rollback',
        action='store_true',
        help='Revertir la migración'
    )
    
    args = parser.parse_args()
    
    if args.rollback:
        confirm = input("¿Estás seguro de revertir la migración? (s/n): ")
        if confirm.lower() == 's':
            rollback_migration()
        else:
            print("Rollback cancelado")
    else:
        migrate_alertas()
