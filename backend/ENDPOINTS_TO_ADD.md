# app/api/v1/auth_routes.py (agregar al archivo existente)
"""
Agregar estos endpoints al archivo auth_routes.py existente
"""

@router.get("/check-system")
def check_system_status(session: Session = Depends(get_session)):
    """
    Verifica el estado del sistema:
    - Si hay usuarios en la BD
    - Si hay ciclos escolares
    - Si hay grupos
    - Si hay estudiantes
    """
    from app.models import Usuario, CicloEscolar, Grupo, Estudiante
    
    # Contar usuarios
    usuarios_count = session.exec(select(func.count(Usuario.id))).first()
    has_users = usuarios_count > 0
    
    if not has_users:
        return {
            "has_users": False,
            "has_cycles": False,
            "has_groups": False,
            "has_students": False,
            "needs_setup": True
        }
    
    # Contar ciclos
    ciclos_count = session.exec(select(func.count(CicloEscolar.id))).first()
    has_cycles = ciclos_count > 0
    
    # Contar grupos
    grupos_count = session.exec(select(func.count(Grupo.id))).first()
    has_groups = grupos_count > 0
    
    # Contar estudiantes
    estudiantes_count = session.exec(select(func.count(Estudiante.matricula))).first()
    has_students = estudiantes_count > 0
    
    return {
        "has_users": has_users,
        "has_cycles": has_cycles,
        "has_groups": has_groups,
        "has_students": has_students,
        "needs_setup": False
    }


@router.post("/first-setup")
def first_setup(
    username: str = Form(...),
    password: str = Form(...),
    session: Session = Depends(get_session)
):
    """
    Crea el primer usuario administrador del sistema.
    Solo funciona si no hay usuarios en la BD.
    """
    from app.models import Usuario
    from app.core.security import get_password_hash
    
    # Verificar que NO haya usuarios
    usuarios_count = session.exec(select(func.count(Usuario.id))).first()
    if usuarios_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El sistema ya tiene usuarios registrados"
        )
    
    # Validar datos
    if len(username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario debe tener al menos 3 caracteres"
        )
    
    if len(password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 6 caracteres"
        )
    
    # Crear usuario administrador
    usuario = Usuario(
        username=username,
        hashed_password=get_password_hash(password),
        role="Administrador",
        permissions={
            "canViewDashboard": True,
            "canManageAlerts": True,
            "canEditStudents": True,
            "canManageUsers": True,
            "canManageGroups": True,
            "canManageAttendance": True,
            "canManageCycles": True,
            "canViewReports": True,
            "canExportData": True,
            "canManageNFC": True
        }
    )
    
    session.add(usuario)
    session.commit()
    session.refresh(usuario)
    
    return {
        "message": "Usuario administrador creado exitosamente",
        "user": {
            "id": usuario.id,
            "username": usuario.username,
            "role": usuario.role
        }
    }
