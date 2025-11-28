"""
Script para agregar el nuevo permiso canManageAttendance a todos los usuarios existentes.
Este script actualiza la estructura de permisos en la base de datos directamente con SQL.
"""
import sys
import os
import json
from pathlib import Path

# Agregar el directorio raíz al path para poder importar módulos
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.db.database import engine


def add_attendance_permission():
    """
    Agrega el permiso canManageAttendance a todos los usuarios existentes usando SQL directo.
    Por defecto se establece en False, los administradores pueden activarlo después.
    """
    print("=" * 60)
    print("Agregando permiso de Gestión de Asistencia a usuarios")
    print("=" * 60)
    
    with engine.connect() as connection:
        # Obtener todos los usuarios
        result = connection.execute(text("SELECT id, username, role, permissions FROM usuarios"))
        usuarios = result.fetchall()
        
        if not usuarios:
            print("❌ No se encontraron usuarios en la base de datos.")
            return
        
        print(f"\n📊 Se encontraron {len(usuarios)} usuarios.")
        print("\n🔄 Actualizando permisos...")
        
        usuarios_actualizados = 0
        
        for usuario in usuarios:
            user_id, username, role, permissions = usuario
            
            # Verificar si el usuario ya tiene el permiso
            if 'canManageAttendance' not in permissions:
                # Agregar el nuevo permiso
                # Si el usuario es administrador, activarlo por defecto
                if role == 'Administrador':
                    permissions['canManageAttendance'] = True
                    estado = "✓ ACTIVADO"
                else:
                    permissions['canManageAttendance'] = False
                    estado = "○ Desactivado"
                
                # Actualizar en la base de datos usando CAST
                connection.execute(
                    text("UPDATE usuarios SET permissions = CAST(:perms AS jsonb) WHERE id = :uid"),
                    {"perms": json.dumps(permissions), "uid": user_id}
                )
                
                usuarios_actualizados += 1
                print(f"  • {username} ({role}): {estado}")
        
        # Confirmar cambios
        connection.commit()
        
        print(f"\n✅ Proceso completado!")
        print(f"   - Usuarios actualizados: {usuarios_actualizados}")
        print(f"   - Total de usuarios: {len(usuarios)}")
        
        if usuarios_actualizados == 0:
            print("\n💡 Todos los usuarios ya tenían el permiso canManageAttendance.")
        else:
            print("\n💡 Los usuarios ahora tienen el permiso 'Gestión de Asistencia'.")
            print("   Este permiso controla el acceso a:")
            print("   - Registro de Accesos")
            print("   - Corte de Faltas")
        
        print("\n" + "=" * 60)


if __name__ == "__main__":
    try:
        add_attendance_permission()
    except Exception as e:
        print(f"\n❌ Error al ejecutar el script: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
