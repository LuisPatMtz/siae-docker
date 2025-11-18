#!/usr/bin/env python3
"""
Script para agregar la columna full_name a la tabla usuarios.
Ejecutar desde Docker: docker-compose exec backend python scripts/add_full_name_migration.py
"""
import sys
import os

# Agregar el directorio raíz al path de Python
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlmodel import Session, text
from app.db.database import engine

def run_migration():
    """Ejecuta la migración para agregar full_name"""
    print("=" * 70)
    print("MIGRACIÓN: Agregar columna full_name a usuarios")
    print("=" * 70)
    print()
    
    migration_sql = """
        -- Add the full_name column if it doesn't exist
        ALTER TABLE usuarios 
        ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);
    """
    
    try:
        with Session(engine) as session:
            # Ejecutar la migración
            session.exec(text(migration_sql))
            session.commit()
            
            # Verificar que la columna existe
            result = session.exec(text("""
                SELECT column_name, data_type, character_maximum_length, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'usuarios' AND column_name = 'full_name';
            """))
            
            column_info = result.first()
            
            if column_info:
                print("✅ Migración completada exitosamente!")
                print(f"\nDetalles de la columna:")
                print(f"  - Nombre: {column_info[0]}")
                print(f"  - Tipo: {column_info[1]}")
                print(f"  - Longitud máxima: {column_info[2]}")
                print(f"  - Nullable: {column_info[3]}")
            else:
                print("⚠️  No se pudo verificar la columna. Verifica manualmente.")
                
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        return False
    
    print("\n" + "=" * 70)
    print("NOTA: Los usuarios existentes tendrán full_name = NULL")
    print("Puedes actualizarlos manualmente desde la interfaz de gestión.")
    print("=" * 70)
    return True

if __name__ == "__main__":
    run_migration()
