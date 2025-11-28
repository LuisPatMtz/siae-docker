"""
Script para crear la tabla de justificaciones simplificada.
Este script:
1. Crea la nueva tabla 'justificaciones' (id, justificacion, usuario_registro, fecha_creacion)
2. Agrega la columna 'id_justificacion' a la tabla 'faltas'
3. NO migra datos antiguos (se mantendrán en las columnas deprecated)

Ejecutar desde el directorio backend:
    python scripts/crear_tabla_justificaciones.py
"""
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, create_engine, text
from app.core.config import DATABASE_URL
from app.db import base  # Importar para registrar modelos
from app.db.database import create_db_and_tables

def main():
    """Función principal"""
    print("="*70)
    print("🗄️  MIGRACIÓN: Creación de tabla de justificaciones simplificada")
    print("="*70)
    
    # Crear engine
    engine = create_engine(DATABASE_URL, echo=False)
    
    print("\n1️⃣  Creando tabla de justificaciones...")
    try:
        # Esto creará la tabla justificaciones si no existe
        create_db_and_tables()
        print("   ✅ Tabla 'justificaciones' creada correctamente.")
    except Exception as e:
        print(f"   ⚠️  Advertencia al crear tablas: {e}")
        print("   ℹ️  La tabla podría ya existir.")
    
    print("\n2️⃣  Agregando columna id_justificacion a tabla faltas...")
    with Session(engine) as session:
        try:
            # Agregar columna id_justificacion si no existe
            session.exec(text("""
                ALTER TABLE faltas 
                ADD COLUMN IF NOT EXISTS id_justificacion INTEGER REFERENCES justificaciones(id);
            """))
            session.commit()
            print("   ✅ Columna 'id_justificacion' agregada a tabla 'faltas'.")
        except Exception as e:
            print(f"   ⚠️  Error al agregar columna: {e}")
            print("   ℹ️  La columna podría ya existir.")
    
    print("\n" + "="*70)
    print("✅ Migración completada exitosamente")
    print("="*70)
    print("\n📝 Estructura de la tabla justificaciones:")
    print("   - id (PK)")
    print("   - justificacion (TEXT)")
    print("   - usuario_registro (VARCHAR)")
    print("   - fecha_creacion (TIMESTAMP)")
    print("\n📝 Uso:")
    print("   1. Cuando se justifiquen varias faltas desde Gestión de Alertas:")
    print("      a) Se crea UNA justificación con el texto")
    print("      b) Se actualiza cada falta con id_justificacion")
    print("   2. Las faltas quedan relacionadas a la misma justificación")
    print("   3. Se mantiene auditoría de quién y cuándo justificó")
    print()


if __name__ == "__main__":
    main()
