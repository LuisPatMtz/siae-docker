import os
import sys
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Fast_API'))

from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models import Usuario, CicloEscolar
from security import get_password_hash

print("=" * 70)
print("INICIALIZADOR RÁPIDO - SIAE")
print("=" * 70)
print()

# Crear tablas
print("📊 Creando tablas...")
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
                "canManageUsers": True,
            }
        )
        session.add(usuario)
        session.commit()
        session.refresh(usuario)
        print(f"   ✅ Usuario 'admin' creado (ID: {usuario.id})")
    else:
        print(f"   ⚠️  Usuario 'admin' ya existe (ID: {usuario_existente.id})")
    
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
    else:
        print(f"   ⚠️  Ciclo '2024-2025' ya existe (ID: {ciclo_existente.id})")

print("\n" + "=" * 70)
print("✅ COMPLETADO")
print("=" * 70)
print("\n🔑 Credenciales:")
print("   Username: admin")
print("   Password: admin123")
