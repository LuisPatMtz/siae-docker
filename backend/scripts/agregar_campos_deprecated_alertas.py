"""
Script para agregar columnas deprecated a tabla alertas.

IMPORTANTE: Ejecutar dentro del contenedor Docker
docker exec -it siae-backend python scripts/agregar_campos_deprecated_alertas.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, text
from app.db.database import engine


def main():
    print("=" * 60)
    print("MIGRACIÓN: Agregar campos deprecated a tabla alertas")
    print("=" * 60)
    
    with Session(engine) as session:
        try:
            # 1. Verificar columnas existentes
            check_columns = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='alertas' 
                ORDER BY ordinal_position;
            """)
            
            existing_columns = [row[0] for row in session.exec(check_columns)]
            
            print(f"\n📊 Columnas existentes en alertas:")
            for col in existing_columns:
                print(f"   • {col}")
            
            # 2. Agregar columna justificacion si no existe
            if 'justificacion' not in existing_columns:
                print("\n► Agregando columna justificacion...")
                add_justificacion = text("""
                    ALTER TABLE alertas 
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
                    ALTER TABLE alertas 
                    ADD COLUMN fecha_justificacion DATE;
                """)
                session.exec(add_fecha)
                session.commit()
                print("   ✓ Columna fecha_justificacion agregada")
            else:
                print("\n✓ Columna fecha_justificacion ya existe")
            
            # 4. Verificar resultado
            verify_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='alertas' 
                ORDER BY ordinal_position;
            """)
            
            columnas = [row[0] for row in session.exec(verify_query)]
            
            print("\n📋 Columnas finales en tabla alertas:")
            for col in columnas:
                print(f"   • {col}")
            
            print("\n" + "=" * 60)
            print("✅ MIGRACIÓN COMPLETADA")
            print("=" * 60)
            print("\nReinicia el backend: docker-compose restart backend")
        
        except Exception as e:
            print(f"\n❌ ERROR: {e}")
            import traceback
            traceback.print_exc()
            session.rollback()
            sys.exit(1)


if __name__ == "__main__":
    main()
