# 🔄 Normalización del Sistema de Justificaciones

## Resumen de Cambios

Se ha implementado un sistema normalizado de justificaciones que separa la lógica de justificaciones de la tabla de faltas, permitiendo mejor control, auditoría y escalabilidad.

## 📦 Archivos Nuevos

### Backend - Modelos
- `app/models/justificacion.py` - Modelo de datos y DTOs

### Backend - Interfaces
- `app/interfaces/justificacion_repo_if.py` - Interfaz del repositorio

### Backend - Repositorios
- `app/repositories/justificacion_repo.py` - Implementación del repositorio

### Backend - Servicios
- `app/services/justificacion_service.py` - Lógica de negocio

### Backend - API
- `app/api/v1/justificaciones_routes.py` - Endpoints REST

### Scripts
- `scripts/crear_tabla_justificaciones.py` - Script de migración

### Documentación
- `docs/JUSTIFICACIONES_NORMALIZADAS.md` - Documentación completa del sistema

## 📝 Archivos Modificados

- `app/models/falta.py` - Agregada relación con justificaciones, campos antiguos marcados como DEPRECATED
- `app/models/__init__.py` - Exportación de nuevos modelos
- `app/api/v1/__init__.py` - Exportación de nuevo router
- `app/main.py` - Registro del router de justificaciones

## 🗄️ Base de Datos

### Nueva Tabla: `justificaciones`

Campos principales:
- `id` - Identificador único
- `id_falta` - Relación con la falta
- `motivo` - Categoría de justificación
- `descripcion` - Detalle del motivo
- `estado` - Pendiente/Aprobada/Rechazada
- `usuario_registro` - Quién la creó
- `usuario_revision` - Quién la revisó
- `fecha_creacion` - Cuándo se creó
- `fecha_revision` - Cuándo se revisó
- `tiene_documento` - Flag para adjuntos (futuro)
- `ruta_documento` - Path al archivo (futuro)

### Estados

**Justificación:**
- `Pendiente` - Esperando revisión
- `Aprobada` - Aceptada
- `Rechazada` - No aceptada

**Falta (actualizados):**
- `Sin justificar` - Sin justificación
- `Pendiente de revisión` - Justificación en espera
- `Justificada` - Justificación aprobada

## 🚀 Migración

### 1. Ejecutar script de migración

```bash
cd backend
python scripts/crear_tabla_justificaciones.py
```

Este script:
- ✅ Crea la tabla `justificaciones`
- ✅ Migra datos existentes
- ✅ Verifica integridad

### 2. Reiniciar el backend

```bash
docker-compose restart backend
```

## 📡 Endpoints Nuevos

Base URL: `/api/v1/justificaciones`

### Consultas
- `GET /` - Todas las justificaciones
- `GET /pendientes` - Solo pendientes de revisión
- `GET /estudiante/{matricula}` - Por estudiante
- `GET /falta/{id_falta}` - Historial de una falta
- `GET /{id}` - Una específica

### Operaciones
- `POST /` - Crear justificación
- `PATCH /{id}` - Actualizar (solo pendientes)
- `POST /{id}/aprobar` - Aprobar justificación
- `POST /{id}/rechazar` - Rechazar justificación
- `DELETE /{id}` - Eliminar (solo pendientes)

## 💡 Flujo de Trabajo

### 1. Crear Justificación
```json
POST /api/v1/justificaciones/
{
  "id_falta": 123,
  "motivo": "Enfermedad",
  "descripcion": "Gripe con fiebre",
  "usuario_registro": "admin"
}
```
→ Falta cambia a "Pendiente de revisión"

### 2. Aprobar
```json
POST /api/v1/justificaciones/5/aprobar
{
  "estado": "Aprobada",
  "usuario_revision": "director",
  "comentario_revision": "Documentación válida"
}
```
→ Falta cambia a "Justificada"

### 3. Rechazar
```json
POST /api/v1/justificaciones/5/rechazar
{
  "estado": "Rechazada",
  "usuario_revision": "director",
  "comentario_revision": "Falta documentación"
}
```
→ Falta vuelve a "Sin justificar"

## ✅ Ventajas

1. **Historial completo** - Múltiples justificaciones por falta
2. **Auditoría** - Quién, cuándo y por qué
3. **Escalabilidad** - Preparado para adjuntos
4. **Control de proceso** - Estados claros
5. **Separación de responsabilidades** - Tablas especializadas

## 🎨 Frontend (Por Implementar)

Sugerencias para componentes:

1. **Página de Justificaciones Pendientes**
   - Lista de justificaciones en espera
   - Botones Aprobar/Rechazar
   - Modal con detalles del estudiante y la falta

2. **Modal de Historial**
   - Timeline de justificaciones de un estudiante
   - Estado actual de cada una
   - Comentarios de revisión

3. **Formulario de Justificación**
   - Selector de motivo (dropdown)
   - Campo de descripción
   - (Futuro) Upload de documentos

## 📚 Documentación Completa

Ver: `backend/docs/JUSTIFICACIONES_NORMALIZADAS.md`

## 🔗 Compatibilidad

Las columnas antiguas en `faltas` se mantienen:
- `justificacion` (DEPRECATED)
- `fecha_justificacion` (DEPRECATED)

Se actualizan automáticamente al aprobar para mantener compatibilidad con código legacy.

---

**Implementado**: Noviembre 2025
**Backend**: ✅ Completo
**Frontend**: ⏳ Pendiente
