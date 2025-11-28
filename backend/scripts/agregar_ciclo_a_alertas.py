"""
Script de migración: Agregar campo id_ciclo a tabla alertas y limpiar alertas antiguas.

Este script:
1. Agrega la columna id_ciclo a la tabla alertas
2. Agrega la columna justificacion_id a la tabla alertas
3. Asigna el ciclo activo a alertas existentes
4. ELIMINA alertas de ciclos antiguos (opcional)
5. Establece las restricciones

IMPORTANTE: Ejecutar dentro del contenedor Docker
docker exec -it siae-backend python scripts/agregar_ciclo_a_alertas.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, text
from app.db.database import engine


def main():
    print("=" * 60)
    print("MIGRACIÓN: Agregar id_ciclo a tabla alertas")
    print("=" * 60)
    
    with Session(engine) as session:
        try:
            # 1. Obtener ciclo activo
            ciclo_query = text("""
                SELECT id, nombre 
                FROM ciclo_escolar 
                WHERE activo = true 
                LIMIT 1;
            """)
            
            ciclo_result = session.exec(ciclo_query).first()
            
            if not ciclo_result:
                print("\n❌ ERROR: No hay un ciclo escolar activo.")
                return
            
            ciclo_id, ciclo_nombre = ciclo_result
            print(f"\n✓ Ciclo activo: {ciclo_nombre} (ID: {ciclo_id})")
            
            # 2. Verificar si las columnas ya existen
            check_columns = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='alertas' AND column_name IN ('id_ciclo', 'justificacion_id');
            """)
            
            existing_columns = [row[0] for row in session.exec(check_columns)]
            
            if 'id_ciclo' in existing_columns and 'justificacion_id' in existing_columns:
                print("\n⚠️  Las columnas ya existen. Verificando datos...")
                
                # Verificar si hay alertas sin ciclo
                check_data = text("""
                    SELECT COUNT(*) FROM alertas WHERE id_ciclo IS NULL;
                """)
                sin_ciclo = session.exec(check_data).first()[0]
                
                if sin_ciclo == 0:
                    print("   ✓ Todas las alertas tienen ciclo asignado")
                    print("\nMigración ya completada anteriormente.")
                    return
            
            # 3. Agregar columna id_ciclo si no existe
            if 'id_ciclo' not in existing_columns:
                print("\n► Paso 1: Agregando columna id_ciclo...")
                add_id_ciclo = text("""
                    ALTER TABLE alertas 
                    ADD COLUMN IF NOT EXISTS id_ciclo INTEGER;
                """)
                session.exec(add_id_ciclo)
                session.commit()
                print("   ✓ Columna id_ciclo agregada")
            else:
                print("\n✓ Columna id_ciclo ya existe")
            
            # 4. Agregar columna justificacion_id si no existe
            if 'justificacion_id' not in existing_columns:
                print("\n► Paso 2: Agregando columna justificacion_id...")
                add_justificacion_id = text("""
                    ALTER TABLE alertas 
                    ADD COLUMN IF NOT EXISTS justificacion_id INTEGER;
                """)
                session.exec(add_justificacion_id)
                session.commit()
                print("   ✓ Columna justificacion_id agregada")
            else:
                print("\n✓ Columna justificacion_id ya existe")
            
            # 5. Contar alertas actuales
            count_query = text("""
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE estado = 'Activa') as activas,
                    COUNT(*) FILTER (WHERE estado != 'Activa') as cerradas
                FROM alertas;
            """)
            
            counts = session.exec(count_query).first()
            total, activas, cerradas = counts
            
            print(f"\n📊 Alertas existentes:")
            print(f"   • Total: {total}")
            print(f"   • Activas: {activas}")
            print(f"   • Cerradas/Justificadas: {cerradas}")
            
            # 6. Preguntar si desea limpiar alertas antiguas
            if total > 0:
                print(f"\n⚠️  IMPORTANTE: Se detectaron {total} alertas existentes.")
                print(f"   Estas alertas pertenecen a ciclos anteriores.")
                print(f"\nOpciones:")
                print(f"   1. Asignar todas al ciclo activo ({ciclo_nombre})")
                print(f"   2. ELIMINAR alertas antiguas (RECOMENDADO para empezar limpio)")
                print(f"   3. Cancelar")
                
                opcion = input("\nSelecciona una opción (1/2/3): ").strip()
                
                if opcion == "3":
                    print("\n❌ Operación cancelada.")
                    return
                elif opcion == "2":
                    # ELIMINAR alertas antiguas
                    print(f"\n⚠️  Se eliminarán {total} alertas antiguas.")
                    print("   También se eliminará su historial asociado.")
                    confirmar = input("¿Confirmas esta acción? (s/n): ").lower().strip()
                    
                    if confirmar != 's':
                        print("\n❌ Operación cancelada.")
                        return
                    
                    print("\n► Eliminando historial de alertas...")
                    delete_historial = text("DELETE FROM alertas_historial;")
                    session.exec(delete_historial)
                    session.commit()
                    print("   ✓ Historial eliminado")
                    
                    print("\n► Eliminando alertas antiguas...")
                    delete_alertas = text("DELETE FROM alertas;")
                    session.exec(delete_alertas)
                    session.commit()
                    print("   ✓ Alertas eliminadas")
                    
                    print("\n✅ Sistema de alertas limpiado.")
                    print("   Las nuevas alertas se crearán con el ciclo activo.")
                    
                elif opcion == "1":
                    # Asignar al ciclo activo
                    print(f"\n► Asignando alertas al ciclo {ciclo_nombre}...")
                    update_query = text(f"""
                        UPDATE alertas 
                        SET id_ciclo = {ciclo_id}
                        WHERE id_ciclo IS NULL;
                    """)
                    session.exec(update_query)
                    session.commit()
                    print(f"   ✓ {total} alertas asignadas al ciclo activo")
            
            # 7. Establecer restricciones si es necesario
            try:
                print("\n► Paso 3: Estableciendo restricciones...")
                
                # NOT NULL solo si no hay alertas
                count_check = text("SELECT COUNT(*) FROM alertas;")
                if session.exec(count_check).first()[0] == 0:
                    set_not_null = text("""
                        ALTER TABLE alertas 
                        ALTER COLUMN id_ciclo SET NOT NULL;
                    """)
                    session.exec(set_not_null)
                    session.commit()
                    print("   ✓ Restricción NOT NULL aplicada")
                
                # Foreign key constraints
                add_fk_ciclo = text("""
                    ALTER TABLE alertas 
                    ADD CONSTRAINT fk_alertas_ciclo 
                    FOREIGN KEY (id_ciclo) REFERENCES ciclo_escolar(id)
                    ON DELETE CASCADE;
                """)
                session.exec(add_fk_ciclo)
                session.commit()
                print("   ✓ Foreign key ciclo creada")
                
                add_fk_justificacion = text("""
                    ALTER TABLE alertas 
                    ADD CONSTRAINT fk_alertas_justificacion 
                    FOREIGN KEY (justificacion_id) REFERENCES justificaciones(id)
                    ON DELETE SET NULL;
                """)
                session.exec(add_fk_justificacion)
                session.commit()
                print("   ✓ Foreign key justificacion creada")
                
            except Exception as e:
                if "already exists" in str(e).lower():
                    print("   ⚠️  Constraints ya existen")
                    session.rollback()
                else:
                    raise
            
            print("\n" + "=" * 60)
            print("✅ MIGRACIÓN COMPLETADA")
            print("=" * 60)
            print(f"\nPróximos pasos:")
            print("1. Reinicia el backend: docker-compose restart backend")
            print("2. Las nuevas alertas se crearán con el ciclo activo")
            print("3. Las alertas estarán separadas por ciclo escolar")
        
        except Exception as e:
            print(f"\n❌ ERROR: {e}")
            import traceback
            traceback.print_exc()
            session.rollback()
            sys.exit(1)


if __name__ == "__main__":
    main()
