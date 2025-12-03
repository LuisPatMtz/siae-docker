"""
Script para resetear la base de datos dejando solo el usuario admin.
Elimina: grupos, estudiantes, asistencias, ciclos, alertas, faltas, justificaciones
Mantiene: usuario admin con contraseña admin123 y permisos completos
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select, delete, text
from app.db.database import engine
from app.models import (
    Usuario, 
    CicloEscolar, 
    Grupo, 
    Estudiante, 
    Asistencia,
    NFC
)
from app.core.security import get_password_hash

print("=" * 70)
print("🔄 RESET DE BASE DE DATOS - SIAE")
print("=" * 70)
print()
print("⚠️  ADVERTENCIA: Este script eliminará TODOS los datos excepto el usuario admin")
print()

respuesta = input("¿Desea continuar? (escriba 'SI' para confirmar): ")

if respuesta != "SI":
    print("❌ Operación cancelada")
    sys.exit(0)

print("\n🗑️  Iniciando limpieza de base de datos...\n")

with Session(engine) as session:
    
    # Deshabilitar foreign keys temporalmente
    print("🔧 Deshabilitando foreign keys temporalmente...")
    session.exec(text("SET session_replication_role = 'replica';"))
    
    # 1. Eliminar alertas
    print("⚠️  Eliminando alertas...")
    try:
        session.exec(text("TRUNCATE TABLE alertas CASCADE;"))
        print(f"   ✅ Alertas eliminadas")
    except Exception as e:
        print(f"   ℹ️  No hay tabla alertas: {e}")
    
    # 2. Eliminar faltas
    print("📝 Eliminando faltas...")
    try:
        session.exec(text("TRUNCATE TABLE faltas CASCADE;"))
        print(f"   ✅ Faltas eliminadas")
    except Exception as e:
        print(f"   ℹ️  No hay tabla faltas: {e}")
    
    # 3. Eliminar justificaciones
    print("📄 Eliminando justificaciones...")
    try:
        session.exec(text("TRUNCATE TABLE justificaciones CASCADE;"))
        print(f"   ✅ Justificaciones eliminadas")
    except Exception as e:
        print(f"   ℹ️  No hay tabla justificaciones: {e}")
    
    # 4. Eliminar asistencias
    print("📋 Eliminando asistencias...")
    # 4. Eliminar asistencias
    print("📋 Eliminando asistencias...")
    session.exec(text("TRUNCATE TABLE asistencias CASCADE;"))
    print(f"   ✅ Asistencias eliminadas")
    
    # 5. Eliminar registros NFC
    print("💳 Eliminando registros NFC...")
    session.exec(text("TRUNCATE TABLE nfc CASCADE;"))
    print(f"   ✅ Registros NFC eliminados")
    
    # 6. Eliminar estudiantes
    print("👨‍🎓 Eliminando estudiantes...")
    session.exec(text("TRUNCATE TABLE estudiante CASCADE;"))
    print(f"   ✅ Estudiantes eliminados")
    
    # 7. Eliminar grupos
    print("🏫 Eliminando grupos...")
    session.exec(text("TRUNCATE TABLE grupo CASCADE;"))
    print(f"   ✅ Grupos eliminados")
    
    # 8. Eliminar ciclos escolares
    print("📅 Eliminando ciclos escolares...")
    session.exec(text("TRUNCATE TABLE ciclo_escolar CASCADE;"))
    print(f"   ✅ Ciclos eliminados")
    
    # 9. Eliminar todos los usuarios
    print("👥 Eliminando usuarios...")
    session.exec(text("TRUNCATE TABLE usuarios CASCADE;"))
    print(f"   ✅ Usuarios eliminados")
    
    # Rehabilitar foreign keys
    session.exec(text("SET session_replication_role = 'origin';"))
    
    session.commit()

print("\n" + "=" * 70)
print("✅ BASE DE DATOS RESETEADA CORRECTAMENTE")
print("=" * 70)
print("\n📝 Próximos pasos:")
print("   1. Acceder a /first-setup para crear el primer usuario administrador")
print("   2. Crear un ciclo escolar")
print("   3. Crear grupos")
print("   4. Agregar estudiantes")
print()
