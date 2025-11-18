# SIAE Backend - Sistema de Asistencia con NFC

**Versión**: 2.0.0  
**Framework**: FastAPI + SQLModel + PostgreSQL  
**Arquitectura**: Modular con Repository Pattern + Services Layer

---

## 📂 Estructura del Proyecto

```
backend/
├── app/                        # Aplicación principal
│   ├── api/                   # Endpoints HTTP
│   │   └── v1/               # API versión 1
│   │       ├── auth_routes.py
│   │       ├── users_routes.py
│   │       ├── estudiantes_routes.py
│   │       ├── grupos_routes.py
│   │       ├── ciclos_routes.py
│   │       ├── tarjetas_routes.py
│   │       ├── acceso_routes.py
│   │       ├── faltas_routes.py
│   │       └── dashboard_routes.py
│   │
│   ├── core/                  # Configuración central
│   │   ├── config.py         # Settings con Pydantic
│   │   ├── security.py       # JWT + bcrypt
│   │   ├── permissions.py    # Sistema de permisos
│   │   ├── logging.py        # Logging centralizado
│   │   └── dependencies.py   # Dependencies compartidas
│   │
│   ├── db/                    # Base de datos
│   │   ├── database.py       # Engine + Session
│   │   └── base.py           # Registro de modelos
│   │
│   ├── models/                # Modelos SQLModel
│   │   ├── usuario.py
│   │   ├── estudiante.py
│   │   ├── grupo.py
│   │   ├── ciclo_escolar.py
│   │   ├── nfc.py
│   │   ├── acceso.py
│   │   ├── falta.py
│   │   ├── auth.py           # DTOs autenticación
│   │   └── dashboard.py      # DTOs estadísticas
│   │
│   ├── interfaces/            # Contratos de repositorios
│   │   ├── usuario_repo_if.py
│   │   ├── estudiante_repo_if.py
│   │   ├── grupo_repo_if.py
│   │   ├── ciclo_repo_if.py
│   │   ├── nfc_repo_if.py
│   │   ├── acceso_repo_if.py
│   │   └── falta_repo_if.py
│   │
│   ├── repositories/          # Implementaciones de datos
│   │   ├── usuario_repo.py
│   │   ├── estudiante_repo.py
│   │   ├── grupo_repo.py
│   │   ├── ciclo_repo.py
│   │   ├── nfc_repo.py
│   │   ├── acceso_repo.py
│   │   └── falta_repo.py
│   │
│   ├── services/              # Lógica de negocio
│   │   ├── nfc_service.py
│   │   ├── acceso_service.py
│   │   ├── falta_service.py
│   │   └── dashboard_service.py
│   │
│   └── main.py               # App principal + middleware
│
├── docs/                      # Documentación
│   ├── ARQUITECTURA.md       # Guía de arquitectura completa
│   ├── README.md             # README original
│   ├── DOCKER_GUIDE.md       # Guía de Docker
│   └── POSTMAN_GUIDE.md      # Guía de testing con Postman
│
├── scripts/                   # Scripts de utilidad
│   ├── crear_admin_docker.py # Crear usuario admin
│   ├── inicializar_db.py     # Inicializar base de datos
│   └── actualizar_permisos_admin.py
│
├── logs/                      # Logs generados (gitignored)
│   ├── api.log
│   ├── security.log
│   └── errors.log
│
├── .env                       # Variables de entorno
├── requirements.txt           # Dependencias Python
├── Dockerfile                 # Imagen Docker
├── docker-compose.yml         # Orquestación
└── README.md                  # Este archivo
```

---

## 🚀 Inicio Rápido

### Opción 1: Docker (Recomendado)

```bash
# 1. Clonar repositorio y navegar a backend
cd backend

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Levantar servicios
docker-compose up -d

# 4. Crear usuario admin
docker exec -it siae-backend python scripts/crear_admin_docker.py

# 5. Acceder a la API
# http://localhost:8000/docs
```

### Opción 2: Local

```bash
# 1. Crear entorno virtual
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar PostgreSQL y .env

# 4. Inicializar base de datos
python scripts/inicializar_db.py

# 5. Crear usuario admin
python scripts/crear_admin_docker.py

# 6. Ejecutar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🏗️ Arquitectura

### Capas de la Aplicación

```
HTTP Request
    ↓
[Middleware] (Logging, CORS)
    ↓
[Router] (Validación, Orquestación)
    ↓
[Service] (Lógica de negocio)
    ↓
[Repository] (Acceso a datos)
    ↓
[Database] (PostgreSQL)
```

### Principios SOLID Aplicados

- **S**ingle Responsibility: Cada capa tiene una única responsabilidad
- **O**pen/Closed: Extensible mediante interfaces
- **L**iskov Substitution: Repositorios intercambiables
- **I**nterface Segregation: Interfaces específicas por entidad
- **D**ependency Inversion: Dependencia de abstracciones

---

## 🔒 Sistema de Seguridad

### Autenticación
- JWT con expiración configurable
- Bcrypt para hashing de contraseñas
- Token en header `Authorization: Bearer <token>`

### Permisos (16 disponibles)

| Categoría | Permisos |
|-----------|----------|
| **Usuarios** | `canManageUsers`, `canViewUsers`, `canEditPermissions` |
| **Estudiantes** | `canManageStudents`, `canViewStudents`, `canUploadStudents` |
| **Grupos** | `canManageGroups`, `canViewGroups` |
| **Ciclos** | `canManageCycles`, `canActivateCycle` |
| **NFC** | `canManageNFC`, `canViewNFC` |
| **Accesos** | `canRegisterAccess`, `canViewAccess` |
| **Faltas** | `canManageAbsences`, `canJustifyAbsences`, `canViewAbsences` |
| **Dashboard** | `canViewDashboard`, `canViewReports` |

### Uso de Decoradores

```python
from app.core.permissions import require_permission, require_admin

@router.post("/users")
def create_user(
    current_user: Usuario = Depends(require_permission("canManageUsers"))
):
    ...
```

---

## 📊 Logging y Auditoría

### Archivos de Log

- `logs/api.log` - Todas las peticiones HTTP
- `logs/security.log` - Eventos de seguridad
- `logs/errors.log` - Errores de aplicación

### Información Registrada

```json
{
  "timestamp": "2025-11-17T14:30:45",
  "usuario": "admin",
  "method": "POST",
  "endpoint": "/api/v1/estudiantes",
  "ip": "192.168.1.100",
  "status_code": 201,
  "duration_ms": 45.23,
  "success": true
}
```

---

## 🗄️ Base de Datos

### Modelos Principales

- **Usuario**: Autenticación y permisos
- **Estudiante**: Información de alumnos
- **Grupo**: Organización de estudiantes
- **CicloEscolar**: Períodos académicos
- **NFC**: Tarjetas vinculadas
- **Acceso**: Registros de asistencia
- **Falta**: Ausencias y justificaciones

### Relaciones

```
CicloEscolar 1---* Estudiante
Grupo 1---* Estudiante
Estudiante 1---1 NFC
Estudiante 1---* Acceso
Estudiante 1---* Falta
```

---

## 🧪 Testing

### Con Postman
Ver `docs/POSTMAN_GUIDE.md` para colección completa.

### Endpoints Principales

```
POST /login                              # Autenticación
GET  /users/me                           # Usuario actual

GET  /api/v1/estudiantes                 # Listar estudiantes
POST /api/v1/estudiantes                 # Crear estudiante
POST /api/v1/estudiantes/upload-csv      # Carga masiva

POST /api/v1/nfc/vincular                # Vincular tarjeta
POST /api/v1/acceso/registrar            # Registrar acceso

GET  /api/v1/dashboard/turno             # Estadísticas
GET  /api/v1/dashboard/grupo/{id}        # Asistencia de grupo
```

---

## 📦 Dependencias Principales

```
fastapi==0.109.0           # Framework web
sqlmodel==0.0.14           # ORM + Pydantic
uvicorn==0.27.0            # ASGI server
python-jose[cryptography]  # JWT
passlib[bcrypt]            # Password hashing
python-multipart           # Form data
pandas                     # CSV processing
pytz                       # Timezone support
psycopg2-binary           # PostgreSQL driver
```

---

## 🔧 Variables de Entorno

```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/siae_db

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Zona horaria
TIMEZONE=America/Mexico_City

# Entorno
ENVIRONMENT=development
```

---

## 📚 Documentación Adicional

- **Arquitectura Completa**: `docs/ARQUITECTURA.md`
- **Guía Docker**: `docs/DOCKER_GUIDE.md`
- **Testing Postman**: `docs/POSTMAN_GUIDE.md`
- **README Original**: `docs/README.md`

---

## 🤝 Contribución

### Agregar un Nuevo Endpoint

1. **Crear modelo** en `app/models/`
2. **Crear interfaz** en `app/interfaces/`
3. **Implementar repositorio** en `app/repositories/`
4. **Crear servicio** (si requiere lógica) en `app/services/`
5. **Crear router** en `app/api/v1/`
6. **Registrar router** en `app/main.py`
7. **Aplicar permisos** con `@require_permission()`

### Ejecutar Scripts

```bash
# Crear admin
python scripts/crear_admin_docker.py

# Inicializar DB
python scripts/inicializar_db.py

# Actualizar permisos
python scripts/actualizar_permisos_admin.py
```

---

## 📝 Changelog

### v2.0.0 (2025-11-17)
- ✅ Arquitectura modular completa
- ✅ Sistema de permisos con 16 permisos
- ✅ Logging centralizado (api/security/errors)
- ✅ Repository Pattern + Services Layer
- ✅ Documentación completa

### v1.0.0
- Implementación inicial con FastAPI
- CRUD básico de entidades

---

## 📞 Soporte

- **Documentación**: `docs/`
- **Issues**: GitHub Issues
- **API Docs**: http://localhost:8000/docs (Swagger)
- **ReDoc**: http://localhost:8000/redoc

---

**Desarrollado con ❤️ usando FastAPI + SQLModel + PostgreSQL**
