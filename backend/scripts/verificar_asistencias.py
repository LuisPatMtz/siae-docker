"""
Script para verificar asistencias y su ciclo asociado
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, text
from app.db.database import engine


def main():
    print("=" * 60)
    print("VERIFICACIÓN: Asistencias y Ciclos")
    print("=" * 60)
    
    with Session(engine) as session:
        # 1. Ciclo activo
        ciclo_query = text("""
            SELECT id, nombre, activo
            FROM ciclo_escolar 
            ORDER BY activo DESC, id DESC;
        """)
        
        print("\n📋 Ciclos Escolares:")
        ciclos = session.exec(ciclo_query).all()
        for ciclo_id, nombre, activo in ciclos:
            estado = "✓ ACTIVO" if activo else "  "
            print(f"   {estado} ID: {ciclo_id} - {nombre}")
        
        ciclo_activo = next((c for c in ciclos if c[2]), None)
        if ciclo_activo:
            ciclo_activo_id = ciclo_activo[0]
        else:
            print("\n❌ No hay ciclo activo")
            return
        
        # 2. Estudiantes por ciclo
        estudiantes_query = text("""
            SELECT 
                id_ciclo,
                COUNT(*) as total,
                string_agg(DISTINCT matricula, ', ' ORDER BY matricula) as matriculas_ejemplo
            FROM estudiante 
            GROUP BY id_ciclo
            ORDER BY id_ciclo;
        """)
        
        print(f"\n👥 Estudiantes por Ciclo:")
        estudiantes_por_ciclo = session.exec(estudiantes_query).all()
        for id_ciclo, total, ejemplos in estudiantes_por_ciclo:
            ciclo_nombre = next((c[1] for c in ciclos if c[0] == id_ciclo), "Desconocido")
            activo_str = " (ACTIVO)" if id_ciclo == ciclo_activo_id else ""
            print(f"   Ciclo {id_ciclo} {ciclo_nombre}{activo_str}: {total} estudiantes")
            if total <= 5:
                print(f"      Matrículas: {ejemplos}")
        
        # 3. Asistencias por ciclo
        asistencias_query = text("""
            SELECT 
                id_ciclo,
                COUNT(*) as total_registros,
                COUNT(DISTINCT matricula_estudiante) as estudiantes_unicos,
                MIN(timestamp::date) as fecha_min,
                MAX(timestamp::date) as fecha_max
            FROM asistencias 
            GROUP BY id_ciclo
            ORDER BY id_ciclo;
        """)
        
        print(f"\n📊 Asistencias por Ciclo:")
        asistencias_por_ciclo = session.exec(asistencias_query).all()
        for id_ciclo, total, unicos, fecha_min, fecha_max in asistencias_por_ciclo:
            ciclo_nombre = next((c[1] for c in ciclos if c[0] == id_ciclo), "Desconocido")
            activo_str = " (ACTIVO)" if id_ciclo == ciclo_activo_id else ""
            print(f"   Ciclo {id_ciclo} {ciclo_nombre}{activo_str}:")
            print(f"      • {total} registros de asistencia")
            print(f"      • {unicos} estudiantes diferentes")
            print(f"      • Periodo: {fecha_min} a {fecha_max}")
        
        # 4. Últimas asistencias
        ultimas_query = text("""
            SELECT 
                a.id,
                a.matricula_estudiante,
                a.tipo,
                a.timestamp::date as fecha,
                a.id_ciclo,
                c.nombre as ciclo_nombre,
                a.es_valida
            FROM asistencias a
            JOIN ciclo_escolar c ON a.id_ciclo = c.id
            ORDER BY a.id DESC
            LIMIT 10;
        """)
        
        print(f"\n🕒 Últimas 10 Asistencias:")
        ultimas = session.exec(ultimas_query).all()
        for aid, matricula, tipo, fecha, cid, cnombre, valida in ultimas:
            validez = "✓" if valida else "✗" if valida is False else "⏳"
            activo_str = " [ACTIVO]" if cid == ciclo_activo_id else ""
            print(f"   {validez} ID:{aid} | {matricula} | {tipo:7} | {fecha} | Ciclo {cid} {cnombre}{activo_str}")
        
        # 5. Faltas por ciclo
        faltas_query = text("""
            SELECT 
                id_ciclo,
                estado,
                COUNT(*) as total,
                MIN(fecha) as fecha_min,
                MAX(fecha) as fecha_max
            FROM faltas 
            GROUP BY id_ciclo, estado
            ORDER BY id_ciclo, estado;
        """)
        
        print(f"\n❌ Faltas por Ciclo y Estado:")
        faltas_por_ciclo = session.exec(faltas_query).all()
        if faltas_por_ciclo:
            for id_ciclo, estado, total, fecha_min, fecha_max in faltas_por_ciclo:
                ciclo_nombre = next((c[1] for c in ciclos if c[0] == id_ciclo), "Desconocido")
                activo_str = " (ACTIVO)" if id_ciclo == ciclo_activo_id else ""
                print(f"   Ciclo {id_ciclo} {ciclo_nombre}{activo_str} - {estado}: {total} faltas ({fecha_min} a {fecha_max})")
        else:
            print("   No hay faltas registradas")
        
        print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
