# ARQUITECTURA SIAE - Documentación Completa

## 📋 Índice
1. [Estructura General](#estructura-general)
2. [Capas de la Arquitectura](#capas-de-la-arquitectura)
3. [Seguridad y Permisos](#seguridad-y-permisos)
4. [Logging y Auditoría](#logging-y-auditoría)
5. [Repositorios y Servicios](#repositorios-y-servicios)
6. [Guía de Uso](#guía-de-uso)

---

## 🏗️ Estructura General

```
Fast_API/
├── app/
│   ├── core/                    # Configuración central
│   │   ├── config.py           # Settings con Pydantic
│   │   ├── security.py         # JWT + bcrypt
│   │   ├── permissions.py      # Sistema de permisos ⭐
│   │   ├── logging.py          # Logging centralizado ⭐
│   │   └── dependencies.py     # Dependencies compartidas
│   │
│   ├── db/                      # Base de datos
│   │   ├── database.py         # Engine + Session
│   │   └── base.py             # Registro de modelos
│   │
│   ├── models/                  # Modelos SQLModel (10 archivos)
│   │   ├── usuario.py          # Usuario + permisos
│   │   ├── estudiante.py       # Estudiante + DTOs
│   │   ├── grupo.py            # Grupo + DTOs
│   │   ├── ciclo_escolar.py    # Ciclo + DTOs
│   │   ├── nfc.py              # Tarjetas NFC
│   │   ├── acceso.py           # Registro de accesos
│   │   ├── falta.py            # Faltas + justificaciones
│   │   ├── auth.py             # DTOs de autenticación
│   │   ├── dashboard.py        # DTOs de estadísticas
│   │   └── utils.py            # Utilidades
│   │
│   ├── interfaces/              # Contratos de repositorios ⭐
│   │   ├── usuario_repo_if.py
│   │   ├── estudiante_repo_if.py
│   │   ├── grupo_repo_if.py
│   │   ├── ciclo_repo_if.py
│   │   ├── nfc_repo_if.py
│   │   ├── acceso_repo_if.py
│   │   └── falta_repo_if.py
│   │
│   ├── repositories/            # Implementaciones de datos ⭐
│   │   ├── usuario_repo.py     # CRUD usuarios
│   │   ├── estudiante_repo.py  # CRUD estudiantes + bulk ops
│   │   ├── grupo_repo.py       # CRUD grupos
│   │   ├── ciclo_repo.py       # CRUD ciclos + activar
│   │   ├── nfc_repo.py         # CRUD tarjetas NFC
│   │   ├── acceso_repo.py      # Registro de accesos
│   │   └── falta_repo.py       # Gestión de faltas
│   │
│   ├── services/                # Lógica de negocio ⭐
│   │   ├── nfc_service.py      # Vinculación de tarjetas
│   │   ├── acceso_service.py   # Registro de accesos
│   │   ├── falta_service.py    # Gestión de faltas
│   │   └── dashboard_service.py# Cálculo de estadísticas
│   │
│   ├── api/v1/                  # Endpoints HTTP
│   │   ├── auth_routes.py      # Login
│   │   ├── users_routes.py     # CRUD usuarios
│   │   ├── estudiantes_routes.py # CRUD estudiantes
│   │   ├── grupos_routes.py    # CRUD grupos
│   │   ├── ciclos_routes.py    # CRUD ciclos
│   │   ├── tarjetas_routes.py  # Gestión NFC
│   │   ├── acceso_routes.py    # Registro accesos
│   │   ├── faltas_routes.py    # Gestión faltas
│   │   └── dashboard_routes.py # Estadísticas
│   │
│   └── main.py                  # App principal + middleware
│
└── logs/                        # Logs generados ⭐
    ├── api.log                 # Todas las peticiones
    ├── security.log            # Eventos de seguridad
    └── errors.log              # Errores de aplicación
```

---

## 🎯 Capas de la Arquitectura

### 1. **HTTP Layer (Routers)**
- **Responsabilidad**: Orquestar peticiones HTTP
- **NO debe**: Contener lógica de negocio o SQL
- **SÍ debe**: Validar entrada, llamar servicios, devolver respuesta

```python
@router.post("/nfc", response_model=NFCRead)
def create_nfc(
    *,
    session: Session = Depends(get_session),
    nfc: NFCCreate,
    current_user: Usuario = Depends(require_permission("canManageNFC"))
):
    service = NFCService(session)
    result = service.vincular_tarjeta(nfc)
    log_action("nfc_vincular", current_user.username, f"Vinculó NFC: {nfc.nfc_uid}")
    return result
```

### 2. **Service Layer (Servicios)**
- **Responsabilidad**: Lógica de negocio
- **Usa**: Repositorios para acceso a datos
- **Valida**: Reglas de negocio complejas

```python
class NFCService:
    def vincular_tarjeta(self, nfc_data: NFCCreate) -> NFC:
        # Validar estudiante existe
        # Validar UID no duplicado
        # Validar estudiante sin tarjeta
        # Crear tarjeta
        return self.nfc_repo.create(nfc_data)
```

### 3. **Repository Layer (Repositorios)**
- **Responsabilidad**: Acceso a datos
- **Encapsula**: Todo el SQL
- **Retorna**: Modelos o primitivos

```python
class NFCRepository(INFCRepository):
    def create(self, nfc_data: NFCCreate) -> NFC:
        db_nfc = NFC.model_validate(nfc_data)
        self.session.add(db_nfc)
        self.session.commit()
        self.session.refresh(db_nfc)
        return db_nfc
```

### 4. **Model Layer (Modelos)**
- **Responsabilidad**: Esquema de datos
- **Define**: Tablas SQL + DTOs + Validaciones

---

## 🔒 Seguridad y Permisos

### Sistema de Permisos (app/core/permissions.py)

#### Permisos Disponibles

| Categoría | Permiso | Descripción |
|-----------|---------|-------------|
| **Usuarios** | `canManageUsers` | Crear, editar, eliminar usuarios |
| | `canViewUsers` | Ver lista de usuarios |
| | `canEditPermissions` | Modificar permisos |
| **Estudiantes** | `canManageStudents` | CRUD estudiantes |
| | `canViewStudents` | Ver estudiantes |
| | `canUploadStudents` | Carga masiva CSV |
| **Grupos** | `canManageGroups` | CRUD grupos |
| | `canViewGroups` | Ver grupos |
| **Ciclos** | `canManageCycles` | CRUD ciclos |
| | `canActivateCycle` | Activar/desactivar |
| **NFC** | `canManageNFC` | Vincular/desvincular |
| | `canViewNFC` | Ver tarjetas |
| **Accesos** | `canRegisterAccess` | Registrar manualmente |
| | `canViewAccess` | Ver historial |
| **Faltas** | `canManageAbsences` | CRUD faltas |
| | `canJustifyAbsences` | Justificar |
| | `canViewAbsences` | Ver faltas |
| **Dashboard** | `canViewDashboard` | Ver estadísticas |
| | `canViewReports` | Generar reportes |

#### Uso de Decoradores

```python
from app.core.permissions import require_permission, require_admin, require_any_permission

# Requiere UN permiso específico
@router.post("/users")
def create_user(
    current_user: Usuario = Depends(require_permission("canManageUsers"))
):
    ...

# Requiere SER ADMIN
@router.delete("/users/{id}")
def delete_user(
    current_user: Usuario = Depends(require_admin)
):
    ...

# Requiere AL MENOS UNO de varios permisos
@router.get("/students")
def get_students(
    current_user: Usuario = Depends(require_any_permission("canManageStudents", "canViewStudents"))
):
    ...
```

#### Funcionamiento Interno

```python
def require_permission(permission_key: str):
    def permission_dependency(current_user: Usuario = Depends(get_current_user)):
        # Admins tienen TODOS los permisos
        if current_user.role == "admin":
            return current_user
        
        # Verificar permiso específico
        has_permission = current_user.permissions.get(permission_key, False)
        if not has_permission:
            raise HTTPException(403, detail=f"Se requiere: {permission_key}")
        
        return current_user
    
    return permission_dependency
```

---

## 📊 Logging y Auditoría

### Sistema de Logging (app/core/logging.py)

#### Archivos de Log

| Archivo | Contenido |
|---------|-----------|
| `logs/api.log` | Todas las peticiones HTTP con timing |
| `logs/security.log` | Eventos de seguridad (login, permisos denegados) |
| `logs/errors.log` | Errores 5xx y excepciones |

#### Formato de Logs

```json
{
  "timestamp": "2025-11-17T14:30:45.123-06:00",
  "usuario": "admin",
  "method": "POST",
  "endpoint": "/api/v1/estudiantes",
  "ip": "192.168.1.100",
  "status_code": 201,
  "duration_ms": 45.23,
  "success": true
}
```

#### Middleware Automático

El `LoggingMiddleware` registra AUTOMÁTICAMENTE:
- ✅ Usuario (extraído del JWT)
- ✅ Endpoint
- ✅ IP del cliente
- ✅ Método HTTP
- ✅ Código de respuesta
- ✅ Duración en milisegundos
- ✅ Errores si los hay

#### Logging Manual desde Endpoints

```python
from app.core.logging import log_action, log_security_event

# Registrar una acción
log_action(
    action="create_user",
    username=current_user.username,
    details=f"Creó usuario: {new_user.username}",
    success=True
)

# Registrar evento de seguridad
log_security_event(
    event_type="permission_denied",
    username=current_user.username,
    ip=request.client.host,
    details=f"Intentó acceder a {endpoint} sin permiso",
    success=False
)
```

---

## 🗂️ Repositorios y Servicios

### Repositorios Implementados

| Repositorio | Funciones Principales |
|-------------|----------------------|
| `UsuarioRepository` | get_all, get_by_username, create, update, update_permissions, delete |
| `EstudianteRepository` | get_all_complete, get_by_matricula, bulk_move_grupo, exists |
| `GrupoRepository` | get_all, get_by_nombre, create, update, delete |
| `CicloRepository` | get_activo, activar (desactiva otros), create, update |
| `NFCRepository` | get_by_uid, get_by_matricula, exists_uid, create, delete |
| `AccesoRepository` | get_by_matricula, exists_acceso_hoy, create, count_periodo |
| `FaltaRepository` | get_filtered, exists_falta, create, justificar, delete |

### Servicios Implementados

| Servicio | Responsabilidad |
|----------|----------------|
| `NFCService` | Vinculación de tarjetas con validaciones completas |
| `AccesoService` | Registro de accesos con control de duplicados |
| `FaltaService` | Gestión de faltas con validaciones de FK |
| `DashboardService` | Cálculo de estadísticas y porcentajes de asistencia |

### Patrón de Uso

```python
# En el router
@router.post("/acceso/registrar")
def registrar_acceso(
    payload: NfcPayload,
    session: Session = Depends(get_session)
):
    service = AccesoService(session)
    acceso = service.registrar_acceso(payload)
    return acceso

# El servicio orquesta
class AccesoService:
    def registrar_acceso(self, payload: NfcPayload) -> Acceso:
        # 1. Validar fecha
        # 2. Validar NFC existe (usa repo)
        # 3. Validar ciclo activo
        # 4. Validar no duplicado (usa repo)
        # 5. Crear acceso (usa repo)
        return self.acceso_repo.create(...)

# El repo solo hace SQL
class AccesoRepository:
    def create(self, nfc_uid, id_ciclo, hora) -> Acceso:
        nuevo_acceso = Acceso(...)
        self.session.add(nuevo_acceso)
        self.session.commit()
        return nuevo_acceso
```

---

## 🚀 Guía de Uso

### 1. Crear un Nuevo Endpoint con Permisos

```python
# app/api/v1/mi_router.py
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.core.permissions import require_permission
from app.core.logging import log_action
from app.db.database import get_session

router = APIRouter(prefix="/mi-recurso", tags=["Mi Recurso"])

@router.post("")
def crear_recurso(
    *,
    session: Session = Depends(get_session),
    current_user = Depends(require_permission("canManageRecurso"))
):
    # Tu lógica aquí
    log_action("crear_recurso", current_user.username, "Creó un recurso")
    return {"mensaje": "Creado"}
```

### 2. Crear un Repositorio

```python
# app/interfaces/mi_repo_if.py
from abc import ABC, abstractmethod

class IMiRepository(ABC):
    @abstractmethod
    def get_all(self) -> List[MiModelo]:
        pass

# app/repositories/mi_repo.py
class MiRepository(IMiRepository):
    def __init__(self, session: Session):
        self.session = session
    
    def get_all(self) -> List[MiModelo]:
        statement = select(MiModelo).order_by(MiModelo.nombre)
        return list(self.session.exec(statement).all())
```

### 3. Crear un Servicio

```python
# app/services/mi_service.py
class MiService:
    def __init__(self, session: Session):
        self.session = session
        self.repo = MiRepository(session)
    
    def operacion_compleja(self, data: MiDTO) -> MiModelo:
        # Validaciones de negocio
        if not self.validar(data):
            raise HTTPException(400, "Dato inválido")
        
        # Usar repositorio
        return self.repo.create(data)
```

### 4. Agregar Logging Manual

```python
from app.core.logging import log_action, log_security_event, log_error

# Acción exitosa
log_action("delete_student", username, f"Eliminó estudiante {matricula}", success=True)

# Evento de seguridad
log_security_event("login_success", username, ip_address, "Login exitoso")

# Error
log_error("DatabaseError", endpoint, username, str(error), traceback_str)
```

---

## 🎓 Principios SOLID Aplicados

| Principio | Implementación |
|-----------|----------------|
| **S**ingle Responsibility | Cada capa tiene una responsabilidad: Routers→HTTP, Services→Negocio, Repos→Datos |
| **O**pen/Closed | Interfaces permiten extender sin modificar código existente |
| **L**iskov Substitution | Cualquier implementación de IRepository es intercambiable |
| **I**nterface Segregation | Interfaces específicas por entidad (no una mega-interface) |
| **D**ependency Inversion | Routers y Services dependen de abstracciones (interfaces) no implementaciones |

---

## 📝 Ejemplo Completo de Flujo

### POST /api/v1/estudiantes (Crear estudiante)

```
1. HTTP Request
   ↓
2. FastAPI Router (estudiantes_routes.py)
   - Valida JWT token
   - Valida permisos (require_permission("canManageStudents"))
   - Valida schema EstudianteCreate
   ↓
3. Middleware de Logging
   - Registra: usuario, endpoint, IP, timestamp
   ↓
4. Router llama: EstudianteRepository(session)
   ↓
5. Repositorio ejecuta SQL:
   - session.add(estudiante)
   - session.commit()
   ↓
6. Repositorio retorna: Estudiante
   ↓
7. Router retorna: HTTP 201 + EstudianteRead
   ↓
8. Middleware registra: status=201, duration_ms
   ↓
9. Log final en logs/api.log:
   {
     "usuario": "admin",
     "endpoint": "/api/v1/estudiantes",
     "status_code": 201,
     "duration_ms": 23.4,
     "success": true
   }
```

---

## ✅ Checklist de Seguridad Implementado

- [x] Autenticación JWT con expiración
- [x] Hashing bcrypt de contraseñas
- [x] Sistema de permisos granular
- [x] Decoradores @require_permission
- [x] Logging de todas las peticiones
- [x] Logging de eventos de seguridad
- [x] Registro de IP del cliente
- [x] Middleware automático de auditoría
- [x] Separación de concerns (SOLID)
- [x] Validación de schemas con Pydantic
- [x] Control de accesos a nivel de endpoint

---

## 🔄 Próximos Pasos Recomendados

1. **Testing**: Implementar tests unitarios para servicios y repositorios
2. **Rate Limiting**: Añadir límite de peticiones por IP/usuario
3. **Frontend**: Sincronizar permisos con AuthContext en React
4. **Documentación**: Mantener este documento actualizado
5. **Monitoreo**: Dashboard de logs en tiempo real

---

**Versión**: 2.0.0  
**Fecha**: Noviembre 2025  
**Estado**: ✅ Arquitectura completa implementada
