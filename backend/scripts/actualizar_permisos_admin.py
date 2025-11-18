"""
Script para actualizar los permisos del usuario admin.
Ejecutar dentro del contenedor: docker-compose exec backend python actualizar_permisos_admin.py
"""

from sqlmodel import Session, select
from database import engine
from models import Usuario

print("=" * 70)
print("ACTUALIZAR PERMISOS DEL USUARIO ADMIN")
print("=" * 70)
print()

with Session(engine) as session:
    # Buscar el usuario admin
    statement = select(Usuario).where(Usuario.username == "admin")
    usuario = session.exec(statement).first()
    
    if not usuario:
        print("❌ Usuario 'admin' no encontrado.")
        exit(1)
    
    print(f"Usuario encontrado: {usuario.username} (ID: {usuario.id})")
    print(f"Role actual: {usuario.role}")
    print(f"Permisos actuales: {usuario.permissions}")
    print()
    
    # Actualizar permisos con los nombres correctos
    permisos_correctos = {
        "canViewDashboard": True,
        "canManageAlerts": True,
        "canEditStudents": True,
        "canManageUsers": True
    }
    
    usuario.permissions = permisos_correctos
    session.add(usuario)
    session.commit()
    session.refresh(usuario)
    
    print("✅ Permisos actualizados exitosamente!")
    print(f"Nuevos permisos: {usuario.permissions}")
    print()
    print("=" * 70)
    print("El usuario 'admin' ahora tiene acceso completo a:")
    print("  • Dashboard (canViewDashboard)")
    print("  • Alertas (canManageAlerts)")
    print("  • Estudiantes (canEditStudents)")
    print("  • Usuarios (canManageUsers)")
    print("=" * 70)
