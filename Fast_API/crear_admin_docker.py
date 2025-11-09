"""
Script para crear usuario administrador ejecutándose dentro del contenedor Docker.
Este script debe ejecutarse con: docker-compose exec backend python crear_admin_docker.py
"""

from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models import Usuario, CicloEscolar
from security import get_password_hash
from datetime import date

print("=" * 70)
print("INICIALIZADOR RÁPIDO - SIAE (Docker)")
print("=" * 70)
print()

# Crear tablas
print("📊 Verificando tablas...")
create_db_and_tables()

with Session(engine) as session:
    # Crear usuario admin
    print("\n👤 Creando usuario administrador...")
    
    statement = select(Usuario).where(Usuario.username == "admin")
    usuario_existente = session.exec(statement).first()
    
    if not usuario_existente:
        usuario = Usuario(
            username="admin",
            hashed_password=get_password_hash("admin123"),
            role="Administrador",
            permissions={
                "canViewDashboard": True,
                "canManageAlerts": True,
                "canEditStudents": True,
                "canManageUsers": True
            }
        )
        session.add(usuario)
        session.commit()
        session.refresh(usuario)
        print(f"   ✅ Usuario 'admin' creado (ID: {usuario.id})")
        print(f"   Role: {usuario.role}")
    else:
        print(f"   ⚠️  Usuario 'admin' ya existe (ID: {usuario_existente.id})")
        print(f"   Role: {usuario_existente.role}")
    
    # Crear ciclo escolar
    print("\n📅 Creando ciclo escolar...")
    
    statement = select(CicloEscolar).where(CicloEscolar.nombre == "2024-2025")
    ciclo_existente = session.exec(statement).first()
    
    if not ciclo_existente:
        ciclo = CicloEscolar(
            nombre="2024-2025",
            fecha_inicio=date(2024, 8, 1),
            fecha_fin=date(2025, 7, 31),
            activo=True
        )
        session.add(ciclo)
        session.commit()
        session.refresh(ciclo)
        print(f"   ✅ Ciclo '2024-2025' creado (ID: {ciclo.id})")
        print(f"   Activo: {ciclo.activo}")
    else:
        print(f"   ⚠️  Ciclo '2024-2025' ya existe (ID: {ciclo_existente.id})")
        print(f"   Activo: {ciclo_existente.activo}")

print("\n" + "=" * 70)
print("✅ COMPLETADO")
print("=" * 70)
print("\n🔑 Credenciales de acceso:")
print("   Username: admin")
print("   Password: admin123")
print("\n🌐 Endpoints disponibles:")
print("   API:   http://localhost:8000")
print("   Docs:  http://localhost:8000/docs")
print("   Login: POST http://localhost:8000/login")
print()
