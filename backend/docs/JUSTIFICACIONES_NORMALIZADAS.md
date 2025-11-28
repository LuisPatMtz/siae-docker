# Sistema de Justificaciones Normalizado

## 📋 Descripción General

El sistema de justificaciones ha sido normalizado para separar la lógica de justificaciones de la tabla de faltas. Esto permite un mejor control, auditoría e historial de las justificaciones.

## 🗄️ Estructura de Base de Datos

### Tabla `justificaciones`

```sql
CREATE TABLE justificaciones (
    id SERIAL PRIMARY KEY,
    id_falta INTEGER NOT NULL REFERENCES faltas(id),
    motivo VARCHAR NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    usuario_registro VARCHAR,
    
    -- Documentación (futuro)
    tiene_documento BOOLEAN DEFAULT FALSE,
    ruta_documento VARCHAR,
    
    -- Aprobación
    estado VARCHAR NOT NULL DEFAULT 'Pendiente',
    fecha_revision TIMESTAMP,
    usuario_revision VARCHAR,
    comentario_revision TEXT
);
```

### Estados de Justificación

- **Pendiente**: Justificación recién creada, esperando revisión
- **Aprobada**: Justificación aprobada por autoridad competente
- **Rechazada**: Justificación rechazada

### Estados de Falta (actualizados)

- **Sin justificar**: Falta sin justificación
- **Pendiente de revisión**: Existe una justificación en estado "Pendiente"
- **Justificada**: Justificación aprobada

## 🔄 Flujo de Trabajo

### 1. Crear Justificación

```bash
POST /api/v1/justificaciones/
```

**Request Body:**
```json
{
  "id_falta": 123,
  "motivo": "Enfermedad",
  "descripcion": "El estudiante presentó gripe con fiebre alta",
  "usuario_registro": "admin"
}
```

**Efecto:**
- Se crea la justificación con estado "Pendiente"
- La falta cambia su estado a "Pendiente de revisión"

### 2. Aprobar Justificación

```bash
POST /api/v1/justificaciones/{id}/aprobar
```

**Request Body:**
```json
{
  "estado": "Aprobada",
  "usuario_revision": "director",
  "comentario_revision": "Documentación médica verificada"
}
```

**Efecto:**
- La justificación cambia a estado "Aprobada"
- La falta cambia a estado "Justificada"
- Se actualiza `fecha_revision` automáticamente

### 3. Rechazar Justificación

```bash
POST /api/v1/justificaciones/{id}/rechazar
```

**Request Body:**
```json
{
  "estado": "Rechazada",
  "usuario_revision": "director",
  "comentario_revision": "Documentación insuficiente"
}
```

**Efecto:**
- La justificación cambia a estado "Rechazada"
- La falta regresa a estado "Sin justificar"

## 📡 Endpoints Disponibles

### Consultas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/justificaciones/` | Todas las justificaciones |
| GET | `/justificaciones/pendientes` | Justificaciones pendientes de revisión |
| GET | `/justificaciones/estudiante/{matricula}` | Justificaciones de un estudiante |
| GET | `/justificaciones/falta/{id_falta}` | Historial de justificaciones de una falta |
| GET | `/justificaciones/{id}` | Una justificación específica |

### Operaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/justificaciones/` | Crear nueva justificación |
| PATCH | `/justificaciones/{id}` | Actualizar justificación (solo pendientes) |
| POST | `/justificaciones/{id}/aprobar` | Aprobar justificación |
| POST | `/justificaciones/{id}/rechazar` | Rechazar justificación |
| DELETE | `/justificaciones/{id}` | Eliminar justificación (solo pendientes) |

## 🎯 Casos de Uso

### Caso 1: Estudiante solicita justificación

```python
# Frontend llama a la API
response = await justificacionesApi.crear({
    id_falta: 123,
    motivo: "Enfermedad",
    descripcion: "Consulta médica por gripe",
    usuario_registro: currentUser.username
})

# Estado de la falta cambia automáticamente a "Pendiente de revisión"
```

### Caso 2: Director revisa justificaciones pendientes

```python
# Obtener todas las pendientes
pendientes = await justificacionesApi.obtenerPendientes()

# Revisar cada una
for justificacion in pendientes:
    if (documentacion_valida):
        await justificacionesApi.aprobar(justificacion.id, {
            estado: "Aprobada",
            usuario_revision: "director",
            comentario_revision: "Aprobada con documentación"
        })
```

### Caso 3: Ver historial de justificaciones de un estudiante

```python
# Obtener todas las justificaciones del estudiante
historial = await justificacionesApi.obtenerPorEstudiante("2025001")

# Cada item incluye:
# - Datos de la justificación
# - Datos de la falta relacionada
# - Estado de aprobación
# - Usuario que registró y revisó
```

## 🔧 Migración desde Sistema Anterior

### Script de Migración

Se proporciona un script para migrar datos existentes:

```bash
cd backend
python scripts/crear_tabla_justificaciones.py
```

El script:
1. Crea la tabla `justificaciones`
2. Migra justificaciones existentes de la columna `justificacion` en `faltas`
3. Marca las migradas como "Aprobadas" (se asume que ya estaban aprobadas)
4. Verifica la integridad de los datos

### Compatibilidad

Las columnas antiguas en la tabla `faltas` se mantienen por compatibilidad:
- `justificacion` (VARCHAR) - **DEPRECATED**
- `fecha_justificacion` (DATE) - **DEPRECATED**

Se actualizan automáticamente al aprobar una justificación para mantener compatibilidad con código legacy.

## 💡 Ventajas del Nuevo Sistema

### 1. **Historial Completo**
- Múltiples justificaciones por falta si es necesario
- No se pierde información de justificaciones rechazadas

### 2. **Auditoría**
- Quién creó la justificación
- Quién la revisó
- Cuándo se realizó cada acción
- Comentarios del revisor

### 3. **Escalabilidad**
- Preparado para agregar adjuntos (certificados, cartas, etc.)
- Campo `tiene_documento` y `ruta_documento` para futuras implementaciones

### 4. **Control de Proceso**
- Estados claros (Pendiente → Aprobada/Rechazada)
- Solo se pueden editar/eliminar justificaciones pendientes
- Historial inmutable una vez aprobada/rechazada

### 5. **Separación de Responsabilidades**
- Tabla `faltas`: Solo registra ausencias
- Tabla `justificaciones`: Maneja el proceso de justificación

## 🎨 Frontend - Componentes Sugeridos

### Página de Justificaciones Pendientes

```jsx
<JustificacionesPendientesPage>
  <ListaJustificaciones>
    {pendientes.map(just => (
      <CardJustificacion
        estudiante={just.matricula_estudiante}
        fechaFalta={just.fecha_falta}
        motivo={just.motivo}
        descripcion={just.descripcion}
        onAprobar={() => aprobar(just.id)}
        onRechazar={() => rechazar(just.id)}
      />
    ))}
  </ListaJustificaciones>
</JustificacionesPendientesPage>
```

### Modal de Historial de Justificaciones

```jsx
<HistorialJustificacionesModal estudiante={matricula}>
  <Timeline>
    {historial.map(just => (
      <TimelineItem
        fecha={just.fecha_creacion}
        estado={just.estado}
        motivo={just.motivo}
        revisor={just.usuario_revision}
      />
    ))}
  </Timeline>
</HistorialJustificacionesModal>
```

## 🔐 Permisos Recomendados

- **Estudiantes/Padres**: Crear justificaciones
- **Profesores**: Ver justificaciones de su grupo
- **Prefectos/Directores**: Aprobar/Rechazar justificaciones
- **Administradores**: Acceso completo

## 📚 Próximas Mejoras

1. **Adjuntar documentos**: Certificados médicos, cartas oficiales
2. **Notificaciones**: Alertar cuando una justificación es aprobada/rechazada
3. **Plazos**: Límite de tiempo para justificar una falta
4. **Reportes**: Estadísticas de justificaciones por motivo, grupo, etc.
5. **Validación automática**: Reglas de negocio para auto-aprobar ciertos casos

---

**Fecha de implementación**: Noviembre 2025
**Versión del sistema**: 2.0.0
