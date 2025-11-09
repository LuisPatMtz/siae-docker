import sys
from datetime import date, datetime
from sqlmodel import Session, select

# --- Importaciones del proyecto ---
try:
    from Fast_API.database import engine, create_db_and_tables
    from Fast_API.models import (
        Usuario, UserPermissionData,
        CicloEscolar, Grupo, Estudiante, NFC,
        get_password_hash
    )
    from Fast_API.security import get_password_hash
except ImportError as e:
    print(f"Error de importación: {e}")
    print("Asegúrate de estar en la carpeta raíz (SIAE_DEV) y que tu app se llama 'Fast_API'")
    sys.exit(1)


def crear_datos_iniciales():
    """Crea datos iniciales para el sistema SIAE"""
    print("--- Inicializando Base de Datos SIAE ---")
    
    try:
        # Crear las tablas
        create_db_and_tables()
        print("✅ Tablas creadas correctamente")
        
        with Session(engine) as session:
            
            # 1. Crear usuario administrador por defecto
            admin_existente = session.exec(
                select(Usuario).where(Usuario.username == "admin")
            ).first()
            
            if not admin_existente:
                admin_permissions = UserPermissionData(
                    canViewDashboard=True,
                    canManageAlerts=True,
                    canEditStudents=True,
                    canManageUsers=True
                )
                
                admin_user = Usuario(
                    username="admin",
                    hashed_password=get_password_hash("admin123"),
                    role="Administrador",
                    permissions=admin_permissions.model_dump()
                )
                
                session.add(admin_user)
                print("✅ Usuario administrador creado (user: admin, pass: admin123)")
            else:
                print("ℹ️  Usuario administrador ya existe")
            
            # 2. Crear ciclo escolar por defecto
            ciclo_existente = session.exec(
                select(CicloEscolar).where(CicloEscolar.nombre == "2024-2025")
            ).first()
            
            if not ciclo_existente:
                ciclo = CicloEscolar(
                    nombre="2024-2025",
                    fecha_inicio=date(2024, 8, 1),
                    fecha_fin=date(2025, 7, 31),
                    activo=True
                )
                session.add(ciclo)
                print("✅ Ciclo escolar 2024-2025 creado y activado")
            else:
                print("ℹ️  Ciclo escolar 2024-2025 ya existe")
            
            # 3. Crear grupos de ejemplo
            grupos_ejemplo = [
                {"nombre": "1A", "turno": "Matutino"},
                {"nombre": "1B", "turno": "Matutino"},
                {"nombre": "2A", "turno": "Matutino"},
                {"nombre": "2B", "turno": "Vespertino"},
                {"nombre": "3A", "turno": "Vespertino"},
            ]
            
            grupos_creados = 0
            for grupo_data in grupos_ejemplo:
                grupo_existente = session.exec(
                    select(Grupo).where(Grupo.nombre == grupo_data["nombre"])
                ).first()
                
                if not grupo_existente:
                    grupo = Grupo(
                        nombre=grupo_data["nombre"],
                        turno=grupo_data["turno"]
                    )
                    session.add(grupo)
                    grupos_creados += 1
            
            if grupos_creados > 0:
                print(f"✅ {grupos_creados} grupos creados")
            else:
                print("ℹ️  Los grupos de ejemplo ya existen")
            
            # 4. Crear estudiantes de ejemplo
            session.commit()  # Commit para tener IDs de ciclo y grupos
            
            # Obtener el ciclo y grupos creados
            ciclo_activo = session.exec(
                select(CicloEscolar).where(CicloEscolar.activo == True)
            ).first()
            
            grupo_1a = session.exec(
                select(Grupo).where(Grupo.nombre == "1A")
            ).first()
            
            if ciclo_activo and grupo_1a:
                estudiantes_ejemplo = [
                    {
                        "matricula": "2024001",
                        "nombre": "Ana",
                        "apellido": "García López",
                        "correo": "ana.garcia@estudiante.edu.mx"
                    },
                    {
                        "matricula": "2024002", 
                        "nombre": "Carlos",
                        "apellido": "Martínez Pérez",
                        "correo": "carlos.martinez@estudiante.edu.mx"
                    },
                    {
                        "matricula": "2024003",
                        "nombre": "María",
                        "apellido": "Rodríguez Silva",
                        "correo": "maria.rodriguez@estudiante.edu.mx"
                    }
                ]
                
                estudiantes_creados = 0
                for est_data in estudiantes_ejemplo:
                    estudiante_existente = session.get(Estudiante, est_data["matricula"])
                    
                    if not estudiante_existente:
                        estudiante = Estudiante(
                            matricula=est_data["matricula"],
                            nombre=est_data["nombre"],
                            apellido=est_data["apellido"],
                            correo=est_data["correo"],
                            id_grupo=grupo_1a.id,
                            id_ciclo=ciclo_activo.id
                        )
                        session.add(estudiante)
                        estudiantes_creados += 1
                
                if estudiantes_creados > 0:
                    print(f"✅ {estudiantes_creados} estudiantes de ejemplo creados")
                else:
                    print("ℹ️  Los estudiantes de ejemplo ya existen")
            
            # Confirmar todos los cambios
            session.commit()
            print("\n🎉 ¡Base de datos inicializada correctamente!")
            print("\n📋 Resumen:")
            print("   - Usuario admin creado (user: admin, pass: admin123)")
            print("   - Ciclo escolar 2024-2025 activo")
            print("   - Grupos de ejemplo creados")
            print("   - Estudiantes de prueba agregados")
            print("\n🚀 Ya puedes ejecutar la API con: uvicorn Fast_API.main:app --reload")
            
    except Exception as e:
        print(f"\n❌ Error al inicializar la base de datos: {e}")
        return False
    
    return True


def mostrar_resumen():
    """Muestra un resumen del estado actual de la base de datos"""
    print("\n--- Resumen del Estado de la Base de Datos ---")
    
    try:
        with Session(engine) as session:
            # Contar usuarios
            total_usuarios = session.exec(select(Usuario)).all()
            print(f"👥 Usuarios: {len(total_usuarios)}")
            for user in total_usuarios:
                print(f"   - {user.username} ({user.role})")
            
            # Contar ciclos
            total_ciclos = session.exec(select(CicloEscolar)).all()
            ciclo_activo = session.exec(
                select(CicloEscolar).where(CicloEscolar.activo == True)
            ).first()
            print(f"\n📅 Ciclos escolares: {len(total_ciclos)}")
            if ciclo_activo:
                print(f"   - Activo: {ciclo_activo.nombre}")
            
            # Contar grupos
            total_grupos = session.exec(select(Grupo)).all()
            print(f"\n🏫 Grupos: {len(total_grupos)}")
            for grupo in total_grupos:
                print(f"   - {grupo.nombre} ({grupo.turno})")
            
            # Contar estudiantes
            total_estudiantes = session.exec(select(Estudiante)).all()
            print(f"\n🎓 Estudiantes: {len(total_estudiantes)}")
            
            # Contar tarjetas NFC
            total_nfc = session.exec(select(NFC)).all()
            print(f"\n💳 Tarjetas NFC: {len(total_nfc)}")
            
    except Exception as e:
        print(f"❌ Error al mostrar resumen: {e}")


if __name__ == "__main__":
    print("=== INICIALIZADOR DE BASE DE DATOS SIAE ===")
    print("Este script creará los datos iniciales necesarios para el sistema.")
    print()
    
    while True:
        print("Opciones:")
        print("1. Inicializar base de datos con datos de ejemplo")
        print("2. Mostrar resumen del estado actual")
        print("3. Salir")
        
        opcion = input("\nSelecciona una opción (1-3): ").strip()
        
        if opcion == "1":
            crear_datos_iniciales()
        elif opcion == "2":
            mostrar_resumen()
        elif opcion == "3":
            print("¡Hasta luego!")
            break
        else:
            print("❌ Opción inválida. Por favor selecciona 1, 2 o 3.")