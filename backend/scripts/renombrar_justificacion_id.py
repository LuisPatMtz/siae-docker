"""
Script para renombrar columna justificacion_id a id_justificacion en tabla faltas.

IMPORTANTE: Ejecutar dentro del contenedor Docker
docker exec -it siae-backend python scripts/renombrar_justificacion_id.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, text
from app.db.database import engine


def main():
    print("=" * 60)
    print("MIGRACIÓN: Renombrar justificacion_id a id_justificacion")
    print("=" * 60)
    
    with Session(engine) as session:
        try:
            # Renombrar columna
            print("\n► Renombrando columna justificacion_id a id_justificacion...")
            
            rename_query = text("""
                ALTER TABLE faltas 
                RENAME COLUMN justificacion_id TO id_justificacion;
            """)
            
            session.exec(rename_query)
            session.commit()
            
            print("   ✓ Columna renombrada exitosamente")
            
            # Verificar
            verify_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='faltas' 
                ORDER BY ordinal_position;
            """)
            
            columnas = [row[0] for row in session.exec(verify_query)]
            
            print("\n📋 Columnas actuales en tabla faltas:")
            for col in columnas:
                print(f"   • {col}")
            
            print("\n" + "=" * 60)
            print("✅ MIGRACIÓN COMPLETADA")
            print("=" * 60)
            print("\nReinicia el backend: docker-compose restart backend")
        
        except Exception as e:
            if "does not exist" in str(e).lower():
                print("\n⚠️  La columna justificacion_id no existe o ya fue renombrada")
                print("   Verificando estado actual...")
                
                verify_query = text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='faltas' AND column_name IN ('justificacion_id', 'id_justificacion');
                """)
                
                result = [row[0] for row in session.exec(verify_query)]
                print(f"\n   Columnas encontradas: {result}")
                
                if 'id_justificacion' in result:
                    print("\n✅ La columna id_justificacion ya existe correctamente")
                else:
                    print("\n❌ No se encontró ninguna de las columnas esperadas")
            else:
                print(f"\n❌ ERROR: {e}")
                import traceback
                traceback.print_exc()
                session.rollback()
                sys.exit(1)


if __name__ == "__main__":
    main()
