# 🧪 Guía de Pruebas Postman - SIAE API

## 📋 Configuración Inicial

### 1. Variables de Entorno en Postman

Crear una nueva colección llamada "SIAE API" y configurar estas variables:

```json
{
  "base_url": "http://localhost:8000",
  "token": ""
}
```

---

## 🔐 1. Autenticación

### 1.1. Login
```
POST {{base_url}}/login
```

**Headers:**
```
Content-Type: application/x-www-form-urlencoded
```

**Body (x-www-form-urlencoded):**
```
username: admin
password: admin123
```

**Script Post-response (Tests):**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("token", jsonData.access_token);
    pm.test("Token guardado", function () {
        pm.expect(jsonData.access_token).to.be.a('string');
    });
}
```

**Respuesta esperada (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

### 1.2. Obtener Usuario Actual
```
GET {{base_url}}/users/me
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Respuesta esperada (200):**
```json
{
  "id": 1,
  "username": "admin",
  "role": "Administrador",
  "permissions": {
    "canViewDashboard": true,
    "canManageAlerts": true,
    "canEditStudents": true,
    "canManageUsers": true
  }
}
```

---

## 👥 2. Gestión de Usuarios

### 2.1. Listar Todos los Usuarios
```
GET {{base_url}}/users
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Respuesta esperada (200):**
```json
[
  {
    "id": 1,
    "username": "admin",
    "role": "Administrador",
    "permissions": {
      "canViewDashboard": true,
      "canManageAlerts": true,
      "canEditStudents": true,
      "canManageUsers": true
    }
  }
]
```

---

### 2.2. Crear Usuario
```
POST {{base_url}}/users
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "username": "profesor1",
  "password": "pass123",
  "role": "Profesor",
  "permissions": {
    "canViewDashboard": true,
    "canManageAlerts": false,
    "canEditStudents": false,
    "canManageUsers": false
  }
}
```

**Respuesta esperada (201):**
```json
{
  "id": 2,
  "username": "profesor1",
  "role": "Profesor",
  "permissions": {
    "canViewDashboard": true,
    "canManageAlerts": false,
    "canEditStudents": false,
    "canManageUsers": false
  }
}
```

---

### 2.3. Obtener Usuario por ID
```
GET {{base_url}}/users/2
```

**Headers:**
```
Authorization: Bearer {{token}}
```

---

### 2.4. Actualizar Permisos de Usuario
```
PATCH {{base_url}}/users/2/permissions
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "permissions": {
    "canViewDashboard": true,
    "canManageAlerts": true,
    "canEditStudents": false,
    "canManageUsers": false
  }
}
```

---

### 2.5. Eliminar Usuario
```
DELETE {{base_url}}/users/2
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Respuesta esperada (200):**
```json
{
  "message": "Usuario eliminado exitosamente"
}
```

---

## 📅 3. Ciclos Escolares

### 3.1. Listar Ciclos
```
GET {{base_url}}/ciclos
```

**Headers:**
```
Authorization: Bearer {{token}}
```

---

### 3.2. Obtener Ciclo Activo
```
GET {{base_url}}/ciclos/activo
```

**Headers:**
```
Authorization: Bearer {{token}}
```

---

### 3.3. Crear Ciclo
```
POST {{base_url}}/ciclos
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "nombre": "2024-2025",
  "fecha_inicio": "2024-08-15",
  "fecha_fin": "2025-06-30",
  "activo": true
}
```

---

### 3.4. Actualizar Ciclo
```
PATCH {{base_url}}/ciclos/1
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "activo": false
}
```

---

### 3.5. Activar Ciclo
```
POST {{base_url}}/ciclos/1/activar
```

**Headers:**
```
Authorization: Bearer {{token}}
```

---

### 3.6. Eliminar Ciclo
```
DELETE {{base_url}}/ciclos/1
```

**Headers:**
```
Authorization: Bearer {{token}}
```

---

## 🎓 4. Grupos

### 4.1. Listar Grupos
```
GET {{base_url}}/grupos
```

**Headers:**
```
Authorization: Bearer {{token}}
```

---

### 4.2. Crear Grupo
```
POST {{base_url}}/grupos
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "nombre": "1A",
  "turno": "Matutino",
  "semestre": 1
}
```

---

### 4.3. Actualizar Grupo
```
PATCH {{base_url}}/grupos/1
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "turno": "Vespertino"
}
```

---

### 4.4. Eliminar Grupo
```
DELETE {{base_url}}/grupos/1
```

**Headers:**
```
Authorization: Bearer {{token}}
```

---

## 👨‍🎓 5. Estudiantes

### 5.1. Listar Estudiantes (Simple)
```
GET {{base_url}}/estudiantes
```

**Headers:**
```
Authorization: Bearer {{token}}
```

---

### 5.2. Listar Estudiantes (Completo con relaciones)
```
GET {{base_url}}/estudiantes/completo
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Respuesta esperada (200):**
```json
[
  {
    "matricula": "2024001",
    "nombre": "Juan",
    "apellido": "Pérez",
    "correo": "juan@example.com",
    "id_grupo": 1,
    "id_ciclo": 1,
    "grupo": {
      "id": 1,
      "nombre": "1A",
      "turno": "Matutino",
      "semestre": 1
    },
    "ciclo": {
      "id": 1,
      "nombre": "2024-2025",
      "fecha_inicio": "2024-08-15",
      "fecha_fin": "2025-06-30",
      "activo": true
    },
    "nfc": {
      "nfc_uid": "ABC12345",
      "matricula_estudiante": "2024001"
    }
  }
]
```

---

### 5.3. Obtener Estudiante por Matrícula
```
GET {{base_url}}/estudiantes/2024001
```

**Headers:**
```
Authorization: Bearer {{token}}
```

---

### 5.4. Crear Estudiante
```
POST {{base_url}}/estudiantes
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "matricula": "2024001",
  "nombre": "Juan",
  "apellido": "Pérez",
  "correo": "juan@example.com",
  "id_grupo": 1,
  "id_ciclo": 1
}
```

---

### 5.5. Actualizar Estudiante
```
PATCH {{base_url}}/estudiantes/2024001
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "id_grupo": 2
}
```

---

### 5.6. Mover Estudiantes en Masa
```
POST {{base_url}}/estudiantes/mover-grupo
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "matriculas": ["2024001", "2024002", "2024003"],
  "nuevo_id_grupo": 2
}
```

---

### 5.7. Subir CSV de Estudiantes
```
POST {{base_url}}/estudiantes/upload-csv
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Body (form-data):**
```
file: [seleccionar archivo .csv]
```

**Formato del CSV:**
```csv
matricula,nombre,apellido,correo,id_grupo,id_ciclo
2024001,Juan,Pérez,juan@example.com,1,1
2024002,María,López,maria@example.com,1,1
```

---

### 5.8. Eliminar Estudiante (CASCADE)
```
DELETE {{base_url}}/estudiantes/2024001
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Nota:** Eliminará también:
- NFC vinculado
- Faltas registradas

---

## 💳 6. Tarjetas NFC

### 6.1. Listar Todas las NFC
```
GET {{base_url}}/nfc
```

**Headers:**
```
Authorization: Bearer {{token}}
```

---

### 6.2. Vincular NFC a Estudiante
```
POST {{base_url}}/nfc/vincular
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "nfc_uid": "ABC12345",
  "matricula_estudiante": "2024001"
}
```

---

### 6.3. Obtener NFC por UID
```
GET {{base_url}}/nfc/ABC12345
```

---

### 6.4. Obtener NFC de Estudiante
```
GET {{base_url}}/nfc/estudiante/2024001
```

---

### 6.5. Eliminar NFC (CASCADE)
```
DELETE {{base_url}}/nfc/ABC12345
```

**Nota:** Eliminará también todos los accesos registrados

---

## 🚪 7. Registro de Acceso

### 7.1. Registrar Acceso (Modo Normal)
```
POST {{base_url}}/acceso/registrar
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "nfc_uid": "ABC12345"
}
```

**Respuesta esperada (200):**
```json
{
  "mensaje": "Acceso registrado",
  "estudiante": "Juan Pérez",
  "hora": "2024-11-16T08:30:45"
}
```

---

### 7.2. Registrar Acceso (Modo Prueba con Fecha)
```
POST {{base_url}}/acceso/registrar
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "nfc_uid": "ABC12345",
  "fecha_registro": "2024-11-15"
}
```

---

### 7.3. Listar Accesos de Estudiante
```
GET {{base_url}}/acceso/estudiante/2024001
```

---

### 7.4. Verificar Acceso de Hoy
```
GET {{base_url}}/acceso/verificar?nfc_uid=ABC12345&ciclo_id=1
```

---

## ❌ 8. Faltas

### 8.1. Listar Faltas
```
GET {{base_url}}/faltas
```

**Headers:**
```
Authorization: Bearer {{token}}
```

---

### 8.2. Filtrar Faltas por Estado
```
GET {{base_url}}/faltas?estado=Ausente
```

**Estados válidos:**
- `Ausente`
- `Justificada`
- `Injustificada`

---

### 8.3. Obtener Faltas de Estudiante
```
GET {{base_url}}/faltas/estudiante/2024001
```

**Headers:**
```
Authorization: Bearer {{token}}
```

---

### 8.4. Crear Falta
```
POST {{base_url}}/faltas
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "matricula_estudiante": "2024001",
  "id_ciclo": 1,
  "fecha": "2024-11-16",
  "estado": "Ausente"
}
```

---

### 8.5. Justificar Falta
```
PATCH {{base_url}}/faltas/1
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "estado": "Justificada",
  "justificacion": "Cita médica"
}
```

---

### 8.6. Eliminar Falta
```
DELETE {{base_url}}/faltas/1
```

**Headers:**
```
Authorization: Bearer {{token}}
```

---

## 📊 9. Dashboard y Estadísticas

### 9.1. Obtener Estadísticas
```
GET {{base_url}}/dashboard/stats?periodo=hoy&turno=Todos
```

**Parámetros:**
- `periodo`: `hoy` | `semana` | `mes`
- `turno`: `Todos` | `Matutino` | `Vespertino`

**Respuesta esperada (200):**
```json
{
  "matutino": {
    "stats": {
      "totalStudents": 50,
      "averageAttendance": 85.5
    },
    "groups": {
      "1A": ["2024001", "2024002"],
      "2A": ["2024010", "2024011"]
    }
  },
  "vespertino": {
    "stats": {
      "totalStudents": 45,
      "averageAttendance": 80.2
    },
    "groups": {}
  }
}
```

---

### 9.2. Obtener Asistencia de Grupo
```
GET {{base_url}}/dashboard/group-attendance/1?periodo=semana
```

**Respuesta esperada (200):**
```json
{
  "totalStudents": 25,
  "attendance": {
    "2024001": 90.0,
    "2024002": 85.5,
    "2024003": 95.0
  }
}
```

---

### 9.3. Obtener Detalle de Estudiante
```
GET {{base_url}}/dashboard/student-attendance/2024001?periodo=mes
```

---

## 🔧 10. Utilidades

### 10.1. Health Check
```
GET {{base_url}/health
```

**Respuesta esperada (200):**
```json
{
  "status": "healthy"
}
```

---

### 10.2. Documentación API
```
Abrir navegador: http://localhost:8000/docs
```

---

### 10.3. ReDoc
```
Abrir navegador: http://localhost:8000/redoc
```

---

## 📝 Notas Importantes

### Códigos de Estado HTTP

- **200** - OK (éxito)
- **201** - Created (recurso creado)
- **400** - Bad Request (error en la petición)
- **401** - Unauthorized (token inválido/faltante)
- **404** - Not Found (recurso no encontrado)
- **409** - Conflict (conflicto, ej. matrícula duplicada)

### Autenticación

Todos los endpoints excepto:
- `/login`
- `/acceso/registrar`
- `/nfc/vincular`
- `/health`

Requieren el header:
```
Authorization: Bearer {{token}}
```

### Zona Horaria

Todos los timestamps están en **America/Mexico_City** (UTC-6).

---

**Fecha:** 16 de Noviembre, 2025  
**Versión API:** 1.0.0
