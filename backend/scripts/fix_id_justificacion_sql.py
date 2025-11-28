"""
Script para corregir el id_justificacion usando SQL directo
"""
import psycopg2
from datetime import datetime

# Configuración de la base de datos
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'siae_db',
    'user': 'siae_admin',
    'password': 'admin123'
}

def fix_id_justificacion():
    """
    Corrige el id_justificacion en las faltas que tienen estado 'Justificado' 
    pero no tienen id_justificacion asignado.
    """
    print("=" * 60)
    print("Corrigiendo id_justificacion en faltas")
    print("=" * 60)
    
    try:
        # Conectar a la base de datos
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # Obtener todas las justificaciones
        cur.execute("""
            SELECT id, justificacion, fecha_creacion 
            FROM justificaciones 
            ORDER BY fecha_creacion
        """)
        justificaciones = cur.fetchall()
        
        print(f"\n📋 Justificaciones encontradas: {len(justificaciones)}")
        for just_id, texto, fecha in justificaciones:
            print(f"   • ID {just_id}: '{texto[:50]}...' (Creada: {fecha})")
        
        # Obtener todas las faltas justificadas sin id_justificacion
        cur.execute("""
            SELECT id, matricula_estudiante, fecha, fecha_justificacion, estado
            FROM faltas 
            WHERE estado = 'Justificado' AND id_justificacion IS NULL
        """)
        faltas_sin_id = cur.fetchall()
        
        print(f"\n🔍 Faltas justificadas sin id_justificacion: {len(faltas_sin_id)}")
        
        if not faltas_sin_id:
            print("\n✅ No hay faltas que corregir. Todas las faltas tienen id_justificacion.")
            cur.close()
            conn.close()
            return
        
        if not justificaciones:
            print("\n⚠️  No hay justificaciones en el sistema. No se pueden asignar IDs.")
            cur.close()
            conn.close()
            return
        
        print(f"\n🔄 Asignando id_justificacion a las faltas...")
        
        # Para simplificar, asignar todas las faltas a la primera justificación
        # (ya que fueron justificadas antes de que existiera el sistema normalizado)
        primera_justificacion_id = justificaciones[0][0]
        
        contador = 0
        for falta_id, matricula, fecha, fecha_just, estado in faltas_sin_id:
            # Actualizar la falta
            cur.execute("""
                UPDATE faltas 
                SET id_justificacion = %s 
                WHERE id = %s
            """, (primera_justificacion_id, falta_id))
            contador += 1
        
        # Confirmar cambios
        conn.commit()
        
        print(f"   • {contador} faltas → Justificación {primera_justificacion_id}")
        print(f"\n✅ Proceso completado!")
        print(f"   - Faltas actualizadas: {contador}")
        print(f"   - Justificación utilizada: {primera_justificacion_id}")
        print("=" * 60)
        
        # Cerrar conexión
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    fix_id_justificacion()
