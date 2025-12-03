# app/models/__init__.py
"""
Módulo de modelos de base de datos y DTOs.
"""
from app.models.ciclo_escolar import CicloEscolar, CicloEscolarCreate, CicloEscolarRead, CicloEscolarUpdate
from app.models.grupo import Grupo, GrupoCreate, GrupoRead, GrupoUpdate
from app.models.usuario import Usuario
from app.models.estudiante import Estudiante, EstudianteCreate, EstudianteRead, EstudianteUpdate, EstudianteBulkMoveGrupo
from app.models.nfc import NFC, NFCCreate, NFCRead, NfcPayload
from app.models.asistencia import Asistencia, AsistenciaCreate, AsistenciaRead
from app.models.alerta import Alerta, AlertaCreate, AlertaRead, AlertaUpdate, AlertaHistorial, AlertaHistorialRead
from app.models.falta import Falta, FaltaCreate, FaltaRead, FaltaUpdate
from app.models.justificacion import Justificacion, JustificacionCreate, JustificacionRead
from app.models.auth import Token, TokenData, UserRead, UserReadWithPermissions, AdminUserCreate, UserPermissionsUpdate, UserUpdate, UserPermissionData
from app.models.dashboard import StatsData, TurnoDataResponse, GrupoAsistenciaResponse
from app.models.system_config import SystemConfig, SystemConfigRead, SystemConfigUpdate
# Importar modelos completos después para evitar dependencias circulares
from app.models.estudiante_complete import EstudianteReadComplete

__all__ = [
    # Modelos de tablas
    "CicloEscolar",
    "Grupo",
    "Usuario",
    "Estudiante",
    "NFC",
    "Asistencia",
    "Alerta",
    "Falta",
    "Justificacion",
    "SystemConfig",
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
    # DTOs Asistencia
    "AsistenciaCreate",
    "AsistenciaRead",
    # DTOs Alerta
    "AlertaCreate",
    "AlertaRead",
    "AlertaUpdate",
    "AlertaHistorial",
    "AlertaHistorialRead",
    # DTOs Falta
    "FaltaCreate",
    "FaltaRead",
    "FaltaUpdate",
    # DTOs Justificacion
    "JustificacionCreate",
    "JustificacionRead",
    # DTOs SystemConfig
    "SystemConfigRead",
    "SystemConfigUpdate",
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
