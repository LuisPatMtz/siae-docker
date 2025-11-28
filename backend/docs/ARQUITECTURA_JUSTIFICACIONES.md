# Diagrama de Arquitectura - Sistema de Justificaciones

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Justificaciones  │  │   Historial de   │  │  Aprobación  │ │
│  │     Página       │  │ Justificaciones  │  │  de Justos   │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
│           │                     │                     │         │
│           └─────────────────────┴─────────────────────┘         │
│                                 │                               │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
                                  │ HTTP/REST
                                  │
┌─────────────────────────────────┼───────────────────────────────┐
│                                 ▼                               │
│                   BACKEND API (FastAPI)                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │          justificaciones_routes.py (API Layer)            │ │
│  │                                                            │ │
│  │  POST   /justificaciones/                                 │ │
│  │  GET    /justificaciones/                                 │ │
│  │  GET    /justificaciones/pendientes                       │ │
│  │  GET    /justificaciones/estudiante/{matricula}           │ │
│  │  GET    /justificaciones/falta/{id_falta}                 │ │
│  │  GET    /justificaciones/{id}                             │ │
│  │  PATCH  /justificaciones/{id}                             │ │
│  │  POST   /justificaciones/{id}/aprobar                     │ │
│  │  POST   /justificaciones/{id}/rechazar                    │ │
│  │  DELETE /justificaciones/{id}                             │ │
│  └──────────────────────────┬────────────────────────────────┘ │
│                             │                                  │
│                             ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │        justificacion_service.py (Business Logic)          │ │
│  │                                                            │ │
│  │  • crear_justificacion()                                  │ │
│  │  • aprobar_justificacion()                                │ │
│  │  • rechazar_justificacion()                               │ │
│  │  • obtener_justificaciones_estudiante()                   │ │
│  │  • obtener_pendientes()                                   │ │
│  │  • actualizar_justificacion()                             │ │
│  │  • eliminar_justificacion()                               │ │
│  │                                                            │ │
│  │  Lógica:                                                   │ │
│  │  - Validar falta existe                                   │ │
│  │  - Actualizar estado de falta automáticamente             │ │
│  │  - Mantener consistencia entre tablas                     │ │
│  └──────────────────────┬────────────────┬───────────────────┘ │
│                         │                │                     │
│                         ▼                ▼                     │
│  ┌──────────────────────────┐  ┌──────────────────────────┐   │
│  │ justificacion_repo.py    │  │    falta_repo.py         │   │
│  │  (Data Access Layer)     │  │  (Data Access Layer)     │   │
│  │                          │  │                          │   │
│  │ • get_all()              │  │ • get_by_id()            │   │
│  │ • get_by_id()            │  │ • update()               │   │
│  │ • get_by_falta()         │  │                          │   │
│  │ • get_by_matricula()     │  │                          │   │
│  │ • get_by_estado()        │  │                          │   │
│  │ • create()               │  │                          │   │
│  │ • update()               │  │                          │   │
│  │ • delete()               │  │                          │   │
│  │ • aprobar_rechazar()     │  │                          │   │
│  └────────────┬─────────────┘  └────────────┬─────────────┘   │
│               │                              │                 │
│               └──────────────┬───────────────┘                 │
│                              │                                 │
└──────────────────────────────┼─────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   PostgreSQL DB      │
                    │                      │
                    │  ┌────────────────┐  │
                    │  │ justificaciones│  │
                    │  │ ┌────────────┐ │  │
                    │  │ │ id (PK)    │ │  │
                    │  │ │ id_falta◄──┼─┼──┼─────┐
                    │  │ │ motivo     │ │  │     │
                    │  │ │ descripcion│ │  │     │
                    │  │ │ estado     │ │  │     │
                    │  │ │ ...        │ │  │     │
                    │  │ └────────────┘ │  │     │
                    │  └────────────────┘  │     │
                    │                      │  1:N│
                    │  ┌────────────────┐  │     │
                    │  │     faltas     │  │     │
                    │  │ ┌────────────┐ │  │     │
                    │  │ │ id (PK)◄───┼─┼──┼─────┘
                    │  │ │ matricula  │ │  │
                    │  │ │ fecha      │ │  │
                    │  │ │ estado     │ │  │
                    │  │ │ ...        │ │  │
                    │  │ └────────────┘ │  │
                    │  └────────────────┘  │
                    └──────────────────────┘
```

## 🔄 Flujo de Datos

### 1. Crear Justificación

```
Usuario → Frontend → POST /justificaciones/
                              ↓
                     justificaciones_routes.py
                              ↓
                     JustificacionService.crear_justificacion()
                              ↓
                     ┌────────┴────────┐
                     ↓                 ↓
          JustificacionRepo     FaltaRepo
            .create()            .update()
                     ↓                 ↓
                     └────────┬────────┘
                              ↓
                         PostgreSQL
                   (INSERT justificacion)
                   (UPDATE falta.estado)
```

### 2. Aprobar Justificación

```
Usuario → Frontend → POST /justificaciones/{id}/aprobar
                              ↓
                     justificaciones_routes.py
                              ↓
                     JustificacionService.aprobar_justificacion()
                              ↓
                     ┌────────┴────────┐
                     ↓                 ↓
          JustificacionRepo     FaltaRepo
         .aprobar_rechazar()     .update()
                     ↓                 ↓
                     └────────┬────────┘
                              ↓
                         PostgreSQL
             (UPDATE justificacion.estado = 'Aprobada')
             (UPDATE falta.estado = 'Justificada')
```

### 3. Consultar Pendientes

```
Usuario → Frontend → GET /justificaciones/pendientes
                              ↓
                     justificaciones_routes.py
                              ↓
                     JustificacionService.obtener_pendientes()
                              ↓
                     ┌────────┴────────┐
                     ↓                 ↓
          JustificacionRepo     FaltaRepo
           .get_by_estado()     .get_by_id()
                     ↓                 ↓
                     └────────┬────────┘
                              ↓
                         PostgreSQL
                (SELECT * FROM justificaciones JOIN faltas)
                              ↓
                     JustificacionConFalta[]
                              ↓
                          Frontend
```

## 📊 Modelo de Datos

### Relaciones

```
Estudiante (1) ──┬──> (N) Faltas
                 │
                 └──> (N) Justificaciones
                          (a través de Faltas)

Falta (1) ──> (N) Justificaciones
```

### Estados y Transiciones

```
FALTA:
┌──────────────┐     crear justif.    ┌─────────────────────┐
│Sin justificar├─────────────────────>│Pendiente de revisión│
└──────────────┘                      └──────────┬──────────┘
       ▲                                         │
       │                                         │
       │ rechazar                          aprobar
       │                                         │
       │                                         ▼
       │                               ┌──────────────┐
       └───────────────────────────────┤ Justificada  │
                                       └──────────────┘

JUSTIFICACIÓN:
┌──────────┐     aprobar      ┌──────────┐
│ Pendiente├─────────────────>│ Aprobada │
└─────┬────┘                  └──────────┘
      │
      │ rechazar
      │
      ▼
┌──────────┐
│Rechazada │
└──────────┘
```

## 🎯 Capas de Arquitectura

### 1. **Presentación (Frontend)**
- Componentes React
- Formularios
- Tablas y listas
- Modales

### 2. **API Layer (Routes)**
- Validación de request
- Manejo de errores HTTP
- Documentación automática (OpenAPI)

### 3. **Business Logic (Services)**
- Validaciones de negocio
- Orquestación de repositorios
- Transacciones
- Consistencia de estados

### 4. **Data Access (Repositories)**
- Queries SQL (SQLModel)
- CRUD operations
- Joins y filtros

### 5. **Persistencia (Database)**
- PostgreSQL
- Tablas relacionales
- Constraints e índices

## 🔐 Separación de Responsabilidades

| Capa | Responsabilidad | No Debe |
|------|----------------|---------|
| **Routes** | HTTP, validación request | Lógica de negocio |
| **Services** | Validaciones, orquestación | Queries SQL directas |
| **Repositories** | Acceso a datos | Validaciones de negocio |
| **Models** | Estructura de datos | Lógica de aplicación |

## 📈 Escalabilidad

### Futuras Mejoras

1. **Adjuntos**: Agregar columna `archivos` con JSON array
2. **Notificaciones**: Integrar servicio de emails/push
3. **Workflow**: Estados adicionales (En revisión, Requiere información)
4. **Automatización**: Auto-aprobar basado en reglas
5. **Analytics**: Dashboard de estadísticas de justificaciones

---

**Diseño**: Clean Architecture + Repository Pattern
**Framework**: FastAPI + SQLModel
**Base de datos**: PostgreSQL
