"""
Script para corregir el id_justificacion en las faltas existentes.
Este script analiza las faltas justificadas y trata de asignarles el id_justificacion correcto.
"""
import sys
import os
from pathlib import Path

# Agregar el directorio raíz al path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlmodel import Session, select
from app.db.database import engine
from app.models import Falta, Justificacion

def fix_id_justificacion():
    """
    Corrige el id_justificacion en las faltas que tienen estado 'Justificado' 
    pero no tienen id_justificacion asignado.
    
    Estrategia:
    1. Obtener todas las justificaciones ordenadas por fecha
    2. Obtener todas las faltas justificadas sin id_justificacion
    3. Asignar las faltas a la justificación más cercana por fecha
    """
    print("=" * 60)
    print("Corrigiendo id_justificacion en faltas")
    print("=" * 60)
    
    with Session(engine) as session:
        # Obtener todas las justificaciones
        justificaciones = session.exec(
            select(Justificacion).order_by(Justificacion.fecha_creacion)
        ).all()
        
        print(f"\n📋 Justificaciones encontradas: {len(justificaciones)}")
        for just in justificaciones:
            print(f"   • ID {just.id}: '{just.justificacion[:50]}...' (Creada: {just.fecha_creacion})")
        
        # Obtener todas las faltas justificadas sin id_justificacion
        faltas_sin_id = session.exec(
            select(Falta).where(
                Falta.estado == "Justificado",
                Falta.id_justificacion == None
            )
        ).all()
        
        print(f"\n🔍 Faltas justificadas sin id_justificacion: {len(faltas_sin_id)}")
        
        if not faltas_sin_id:
            print("\n✅ No hay faltas que corregir. Todas las faltas tienen id_justificacion.")
            return
        
        if not justificaciones:
            print("\n⚠️  No hay justificaciones en el sistema. No se pueden asignar IDs.")
            return
        
        # Agrupar faltas por fecha de justificación
        from collections import defaultdict
        faltas_por_fecha = defaultdict(list)
        
        for falta in faltas_sin_id:
            fecha_just = falta.fecha_justificacion or falta.fecha
            faltas_por_fecha[fecha_just].append(falta)
        
        print(f"\n🔄 Asignando id_justificacion a las faltas...")
        
        contador = 0
        # Para cada grupo de faltas por fecha, asignar la justificación más cercana
        for fecha, faltas in faltas_por_fecha.items():
            # Encontrar la justificación más cercana a esta fecha
            justificacion_mas_cercana = min(
                justificaciones,
                key=lambda j: abs((j.fecha_creacion.date() if hasattr(j.fecha_creacion, 'date') else j.fecha_creacion) - fecha)
            )
            
            # Asignar este id_justificacion a todas las faltas de este grupo
            for falta in faltas:
                falta.id_justificacion = justificacion_mas_cercana.id
                session.add(falta)
                contador += 1
            
            print(f"   • {len(faltas)} faltas del {fecha} → Justificación {justificacion_mas_cercana.id}")
        
        # Confirmar cambios
        session.commit()
        
        print(f"\n✅ Proceso completado!")
        print(f"   - Faltas actualizadas: {contador}")
        print(f"   - Justificaciones utilizadas: {len(justificaciones)}")
        print("=" * 60)

if __name__ == "__main__":
    try:
        fix_id_justificacion()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
