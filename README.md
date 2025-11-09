# SIAE - Sistema Integral de Asistencia Estudiantil

Sistema de control de asistencia mediante tarjetas NFC para instituciones educativas.

## Características Principales

- Control de asistencia con tarjetas NFC/RFID
- Gestión de estudiantes por semestre y grupo
- Vinculación de tarjetas con matrícula estudiantil
- Dashboard con estadísticas en tiempo real
- Sistema de alertas de faltas
- Gestión de usuarios con roles y permisos
- Justificación de inasistencias

---

## Instalación

### Requisitos Previos

- Docker Desktop instalado: https://www.docker.com/get-started/
- Git para clonar el repositorio

### Pasos de Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/LuisPatMtz/siae-docker.git
cd siae-docker
```

2. Iniciar Docker Desktop

3. Construir e iniciar los contenedores:
```bash
docker-compose up --build
```

4. El sistema estará disponible en:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Documentación API: http://localhost:8000/docs

---

## Configuración del Lector NFC

El sistema soporta lectores ACR122U para la vinculación de tarjetas NFC.

### Opciones de Uso:

**Opción 1: Entrada Manual**
- Ingresa el UID de la tarjeta directamente en el sistema
- No requiere configuración adicional

**Opción 2: Lectura Automática**
- Utiliza el ejecutable incluido en `/herramientas/lector-acr122/`
- Lee automáticamente las tarjetas y escribe el UID
- Consulta `GUIA_USO_ACR122.md` para más detalles

---

## Estructura del Proyecto

```
siae-docker/
├── Fast_API/              # Backend (FastAPI + PostgreSQL)
│   ├── routers/          # Endpoints de la API
│   ├── models.py         # Modelos de base de datos
│   ├── security.py       # Autenticación y seguridad
│   └── database.py       # Configuración de BD
├── siaesistema/          # Frontend (React + Vite)
│   └── src/
│       ├── components/   # Componentes React
│       ├── pages/        # Páginas principales
│       └── api/          # Cliente API
├── herramientas/         # Utilidades adicionales
│   └── lector-acr122/    # Ejecutable para lectura automática
├── docker-compose.yml    # Configuración Docker
└── GUIA_USO_ACR122.md   # Documentación del lector NFC
```

---

## Uso del Sistema

### 1. Gestión de Estudiantes
- Registra estudiantes con matrícula, nombre y semestre
- Vincula tarjetas NFC con cada estudiante
- Organiza por grupos académicos

### 2. Control de Asistencia
- Registra entrada con tarjeta NFC
- Visualiza asistencias en tiempo real
- Genera reportes por estudiante o grupo

### 3. Sistema de Alertas
- Alertas automáticas por inasistencias
- Configuración de umbrales por nivel
- Historial de justificaciones

### 4. Gestión de Usuarios
- Roles: Administrador, Docente, Operador
- Permisos configurables por módulo
- Control de acceso granular

---

## Tecnologías Utilizadas

### Backend
- FastAPI (Python)
- PostgreSQL
- SQLAlchemy
- JWT Authentication
- Docker

### Frontend
- React 18
- Vite
- Axios
- Lucide Icons
- CSS3

---

## Documentación Adicional

- `GUIA_USO_ACR122.md` - Guía completa del lector NFC
- `Fast_API/README.md` - Documentación del backend
- `siaesistema/README.md` - Documentación del frontend

---

## Credenciales por Defecto

Usuario: admin
Contraseña: (configurar en primer inicio)

Cambia las credenciales inmediatamente después del primer acceso.

---

## Soporte y Contribuciones

Para reportar problemas o sugerir mejoras, crea un issue en el repositorio de GitHub.

---

## Licencia

Este proyecto es de uso interno educativo.

