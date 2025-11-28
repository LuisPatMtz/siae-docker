"""
Script para migrar estudiantes de un ciclo a otro.

Uso:
docker exec -it siae-backend python scripts/migrar_estudiantes_a_ciclo.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, select, text
from app.db.database import engine


def main():
    print("=" * 60)
    print("MIGRACIÓN: Asignar estudiantes al ciclo activo")
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
            
            # 2. Contar estudiantes sin ciclo o con ciclo diferente
            count_query = text("""
                SELECT 
                    COUNT(*) FILTER (WHERE id_ciclo IS NULL) as sin_ciclo,
                    COUNT(*) FILTER (WHERE id_ciclo IS NOT NULL AND id_ciclo != :ciclo_id) as ciclo_diferente,
                    COUNT(*) FILTER (WHERE id_ciclo = :ciclo_id) as ciclo_actual
                FROM estudiante;
            """)
            
            counts = session.exec(count_query, {"ciclo_id": ciclo_id}).first()
            sin_ciclo, ciclo_diferente, ciclo_actual = counts
            
            print(f"\n📊 Situación actual:")
            print(f"   • Estudiantes en ciclo activo: {ciclo_actual}")
            print(f"   • Estudiantes sin ciclo asignado: {sin_ciclo}")
            print(f"   • Estudiantes en otro ciclo: {ciclo_diferente}")
            
            total_a_migrar = sin_ciclo + ciclo_diferente
            
            if total_a_migrar == 0:
                print(f"\n✅ Todos los estudiantes ya están en el ciclo activo.")
                return
            
            # 3. Preguntar confirmación
            print(f"\n⚠️  Se migrarán {total_a_migrar} estudiantes al ciclo {ciclo_nombre}")
            respuesta = input("¿Deseas continuar? (s/n): ").lower().strip()
            
            if respuesta != 's':
                print("\n❌ Operación cancelada por el usuario.")
                return
            
            # 4. Actualizar estudiantes
            print(f"\n► Migrando estudiantes al ciclo {ciclo_nombre}...")
            
            update_query = text("""
                UPDATE estudiante 
                SET id_ciclo = :ciclo_id
                WHERE id_ciclo IS NULL OR id_ciclo != :ciclo_id
                RETURNING matricula;
            """)
            
            result = session.exec(update_query, {"ciclo_id": ciclo_id})
            matriculas = [row[0] for row in result]
            session.commit()
            
            print(f"   ✓ {len(matriculas)} estudiantes migrados exitosamente")
            
            # 5. Mostrar algunos ejemplos
            if matriculas:
                print(f"\n📝 Ejemplos de matrículas migradas:")
                for matricula in matriculas[:5]:
                    print(f"   • {matricula}")
                if len(matriculas) > 5:
                    print(f"   ... y {len(matriculas) - 5} más")
            
            print("\n" + "=" * 60)
            print("✅ MIGRACIÓN COMPLETADA")
            print("=" * 60)
            print(f"\nTodos los estudiantes ahora están en el ciclo: {ciclo_nombre}")
            print("\nPróximos pasos:")
            print("1. Puedes ejecutar el corte de faltas")
            print("2. Las asistencias nuevas se registrarán en el ciclo activo")
            print("3. Las faltas se crearán para estudiantes del ciclo activo")
        
        except Exception as e:
            print(f"\n❌ ERROR: {e}")
            import traceback
            traceback.print_exc()
            session.rollback()
            sys.exit(1)


if __name__ == "__main__":
    main()
