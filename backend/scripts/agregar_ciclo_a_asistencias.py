"""
Script de migración: Agregar campo id_ciclo a tabla asistencias.

Este script:
1. Agrega la columna id_ciclo a la tabla asistencias
2. Asigna el ciclo activo a todas las asistencias existentes
3. Establece la restricción NOT NULL y foreign key

IMPORTANTE: Ejecutar dentro del contenedor Docker
docker exec -it siae-backend python scripts/agregar_ciclo_a_asistencias.py
"""
import sys
from pathlib import Path

# Agregar el directorio raíz al path para importar módulos
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, text
from app.db.database import engine


def main():
    print("=" * 60)
    print("MIGRACIÓN: Agregar id_ciclo a tabla asistencias")
    print("=" * 60)
    
    with Session(engine) as session:
        try:
            # 1. Obtener el ciclo activo usando SQL directo
            ciclo_query = text("""
                SELECT id, nombre 
                FROM ciclo_escolar 
                WHERE activo = true 
                LIMIT 1;
            """)
            
            ciclo_result = session.exec(ciclo_query).first()
            
            if not ciclo_result:
                print("\n❌ ERROR: No hay un ciclo escolar activo.")
                print("   Por favor, activa un ciclo antes de ejecutar esta migración.")
                return
            
            ciclo_id, ciclo_nombre = ciclo_result
            print(f"\n✓ Ciclo activo encontrado: {ciclo_nombre} (ID: {ciclo_id})")
            
            # 2. Verificar si la columna ya existe
            check_column = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='asistencias' AND column_name='id_ciclo';
            """)
            
            result = session.exec(check_column).first()
            
            if result:
                print("\n⚠️  La columna 'id_ciclo' ya existe en la tabla asistencias.")
                print("   Migración ya aplicada anteriormente.")
                return
            
            print("\n► Paso 1: Agregando columna id_ciclo...")
            
            # 3. Agregar columna id_ciclo (permitiendo NULL temporalmente)
            add_column = text("""
                ALTER TABLE asistencias 
                ADD COLUMN IF NOT EXISTS id_ciclo INTEGER;
            """)
            session.exec(add_column)
            session.commit()
            print("   ✓ Columna agregada")
            
            # 4. Asignar el ciclo activo a todas las asistencias existentes
            print(f"\n► Paso 2: Asignando ciclo activo (ID: {ciclo_id}) a asistencias existentes...")
            
            update_existing = text(f"""
                UPDATE asistencias 
                SET id_ciclo = {ciclo_id}
                WHERE id_ciclo IS NULL;
            """)
            result = session.exec(update_existing)
            session.commit()
            
            print(f"   ✓ Asistencias actualizadas")
            
            # 5. Establecer restricción NOT NULL
            print("\n► Paso 3: Estableciendo restricción NOT NULL...")
            
            set_not_null = text("""
                ALTER TABLE asistencias 
                ALTER COLUMN id_ciclo SET NOT NULL;
            """)
            session.exec(set_not_null)
            session.commit()
            print("   ✓ Restricción NOT NULL aplicada")
            
            # 6. Crear foreign key constraint
            print("\n► Paso 4: Creando foreign key constraint...")
            
            add_fk = text("""
                ALTER TABLE asistencias 
                ADD CONSTRAINT fk_asistencias_ciclo 
                FOREIGN KEY (id_ciclo) REFERENCES ciclo_escolar(id)
                ON DELETE RESTRICT;
            """)
            
            try:
                session.exec(add_fk)
                session.commit()
                print("   ✓ Foreign key constraint creada")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print("   ⚠️  Foreign key constraint ya existe")
                    session.rollback()
                else:
                    raise
            
            # 7. Verificar migración
            print("\n► Paso 5: Verificando migración...")
            
            verify_query = text("""
                SELECT COUNT(*) as total,
                       COUNT(id_ciclo) as con_ciclo
                FROM asistencias;
            """)
            
            stats = session.exec(verify_query).first()
            
            print(f"   ✓ Total asistencias: {stats[0]}")
            print(f"   ✓ Asistencias con ciclo asignado: {stats[1]}")
            
            if stats[0] == stats[1]:
                print("\n" + "=" * 60)
                print("✅ MIGRACIÓN COMPLETADA EXITOSAMENTE")
                print("=" * 60)
                print(f"\nTodas las asistencias han sido asignadas al ciclo: {ciclo_nombre}")
                print("\nPróximos pasos:")
                print("1. Reinicia el contenedor backend: docker-compose restart backend")
                print("2. Las nuevas asistencias se registrarán automáticamente con el ciclo activo")
            else:
                print("\n⚠️  Advertencia: Hay asistencias sin ciclo asignado")
                print("   Algunas asistencias pueden tener problemas")
        
        except Exception as e:
            print(f"\n❌ ERROR durante la migración: {e}")
            print("\nDetalles del error:")
            import traceback
            traceback.print_exc()
            session.rollback()
            sys.exit(1)


if __name__ == "__main__":
    main()
