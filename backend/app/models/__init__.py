# app/models/__init__.py
"""
Módulo de modelos de base de datos y DTOs.
"""
from app.models.ciclo_escolar import CicloEscolar, CicloEscolarCreate, CicloEscolarRead, CicloEscolarUpdate
from app.models.grupo import Grupo, GrupoCreate, GrupoRead, GrupoUpdate
from app.models.usuario import Usuario
from app.models.estudiante import Estudiante, EstudianteCreate, EstudianteRead, EstudianteUpdate, EstudianteBulkMoveGrupo
from app.models.nfc import NFC, NFCCreate, NFCRead, NfcPayload
from app.models.acceso import Acceso, AccesoCreate, AccesoRead
from app.models.falta import Falta, FaltaCreate, FaltaRead, FaltaUpdate
from app.models.auth import Token, TokenData, UserRead, UserReadWithPermissions, AdminUserCreate, UserPermissionsUpdate, UserUpdate, UserPermissionData
from app.models.dashboard import StatsData, TurnoDataResponse, GrupoAsistenciaResponse
# Importar modelos completos después para evitar dependencias circulares
from app.models.estudiante_complete import EstudianteReadComplete

__all__ = [
    # Modelos de tablas
    "CicloEscolar",
    "Grupo",
    "Usuario",
    "Estudiante",
    "NFC",
    "Acceso",
    "Falta",
    # DTOs Ciclo
    "CicloEscolarCreate",
    "CicloEscolarRead",
    "CicloEscolarUpdate",
    # DTOs Grupo
    "GrupoCreate",
    "GrupoRead",
    "GrupoUpdate",
    # DTOs Estudiante
    "EstudianteCreate",
    "EstudianteRead",
    "EstudianteUpdate",
    "EstudianteReadComplete",
    "EstudianteBulkMoveGrupo",
    # DTOs NFC
    "NFCCreate",
    "NFCRead",
    "NfcPayload",
    # DTOs Acceso
    "AccesoCreate",
    "AccesoRead",
    # DTOs Falta
    "FaltaCreate",
    "FaltaRead",
    "FaltaUpdate",
    # DTOs Auth
    "Token",
    "TokenData",
    "UserRead",
    "UserReadWithPermissions",
    "AdminUserCreate",
    "UserPermissionsUpdate",
    "UserUpdate",
    "UserPermissionData",
    # DTOs Dashboard
    "StatsData",
    "TurnoDataResponse",
    "GrupoAsistenciaResponse",
]
