# app/api/v1/reset_routes.py
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlmodel import Session, text
from app.db.database import get_session
from app.core.permissions import require_permission
from app.models import Usuario
from app.core.security import verify_password
from typing import Dict

router = APIRouter(
    prefix="/reset",
    tags=["Reset de Sistema"]
)

@router.post("/delete-all-data")
async def delete_all_data(
    password_data: Dict[str, str] = Body(...),
    current_user: Usuario = Depends(require_permission("canManageMaintenance")),
    session: Session = Depends(get_session)
):
    """
    Elimina TODOS los datos del sistema incluyendo TODOS los usuarios.
    Requiere la contraseña del usuario para confirmar.
    
    PRECAUCIÓN: Esta acción NO SE PUEDE DESHACER.
    Después de esta operación, el sistema quedará completamente vacío
    y se cerrará la sesión automáticamente.
    """
    password = password_data.get("password")
    
    if not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña es requerida"
        )
    
    # Verificar la contraseña del usuario actual
    if not verify_password(password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña incorrecta"
        )
    
    try:
        # Desactivar temporalmente las restricciones de clave foránea
        session.exec(text("SET session_replication_role = 'replica';"))
        
        # Lista de tablas a limpiar (en orden para evitar violaciones de FK)
        # INCLUYE usuarios - se eliminará TODO
        tables_to_truncate = [
            "alertas",
            "faltas", 
            "justificaciones",
            "asistencias",
            "nfc",
            "estudiante",
            "grupo",
            "ciclo_escolar",
            "usuarios"  # Se eliminan TODOS los usuarios
        ]
        
        # Truncar cada tabla
        for table in tables_to_truncate:
            try:
                session.exec(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE;"))
            except Exception as e:
                print(f"Error truncando tabla {table}: {e}")
                # Continuar con las demás tablas
        
        # Reactivar las restricciones
        session.exec(text("SET session_replication_role = 'origin';"))
        
        # Confirmar cambios
        session.commit()
        
        return {
            "message": "Todos los datos han sido eliminados exitosamente. El sistema está completamente vacío.",
            "tables_cleaned": len(tables_to_truncate),
            "users_deleted": True
        }
        
    except Exception as e:
        session.rollback()
        # Asegurarse de reactivar las restricciones incluso si hay error
        try:
            session.exec(text("SET session_replication_role = 'origin';"))
            session.commit()
        except:
            pass
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar los datos: {str(e)}"
        )
