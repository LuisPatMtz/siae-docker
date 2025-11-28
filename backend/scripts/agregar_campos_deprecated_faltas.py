"""
Script de migración: Agregar columnas deprecated a tabla faltas.

Este script agrega las columnas justificacion y fecha_justificacion
que están en el modelo pero no en la base de datos.

IMPORTANTE: Ejecutar dentro del contenedor Docker
docker exec -it siae-backend python scripts/agregar_campos_deprecated_faltas.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, text
from app.db.database import engine


def main():
    print("=" * 60)
    print("MIGRACIÓN: Agregar campos deprecated a tabla faltas")
    print("=" * 60)
    
    with Session(engine) as session:
        try:
            # 1. Verificar si las columnas ya existen
            check_columns = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='faltas' AND column_name IN ('justificacion', 'fecha_justificacion');
            """)
            
            existing_columns = [row[0] for row in session.exec(check_columns)]
            
            print(f"\n📊 Columnas existentes: {existing_columns}")
            
            # 2. Agregar columna justificacion si no existe
            if 'justificacion' not in existing_columns:
                print("\n► Agregando columna justificacion...")
                add_justificacion = text("""
                    ALTER TABLE faltas 
                    ADD COLUMN justificacion VARCHAR;
                """)
                session.exec(add_justificacion)
                session.commit()
                print("   ✓ Columna justificacion agregada")
            else:
                print("\n✓ Columna justificacion ya existe")
            
            # 3. Agregar columna fecha_justificacion si no existe
            if 'fecha_justificacion' not in existing_columns:
                print("\n► Agregando columna fecha_justificacion...")
                add_fecha = text("""
                    ALTER TABLE faltas 
                    ADD COLUMN fecha_justificacion DATE;
                """)
                session.exec(add_fecha)
                session.commit()
                print("   ✓ Columna fecha_justificacion agregada")
            else:
                print("\n✓ Columna fecha_justificacion ya existe")
            
            # 4. Verificar migración
            verify_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='faltas' 
                ORDER BY ordinal_position;
            """)
            
            columnas = [row[0] for row in session.exec(verify_query)]
            
            print("\n📋 Columnas en tabla faltas:")
            for col in columnas:
                print(f"   • {col}")
            
            print("\n" + "=" * 60)
            print("✅ MIGRACIÓN COMPLETADA")
            print("=" * 60)
            print("\nLas columnas deprecated han sido agregadas.")
            print("Reinicia el backend: docker-compose restart backend")
        
        except Exception as e:
            print(f"\n❌ ERROR: {e}")
            import traceback
            traceback.print_exc()
            session.rollback()
            sys.exit(1)


if __name__ == "__main__":
    main()
