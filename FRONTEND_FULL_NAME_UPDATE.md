# Actualización Frontend: Soporte para campo `full_name`

## Resumen
Se ha actualizado el frontend para soportar completamente el campo `full_name` (nombre completo) del usuario en todos los componentes relevantes.asasas
---

## Componentes Actualizados

### 1. **Header.jsx** ✅
**Ubicación**: `siaesistema/src/components/Layout/Header.jsx`

**Cambio realizado**:
```jsx
// ANTES
<span className="user-name">{user?.username || 'Usuario'}</span>
<span className="user-role">({user?.full_name || user?.role || 'Sin información'})</span>

// DESPUÉS
<span className="user-name">{user?.full_name || user?.username || 'Usuario'}</span>
<span className="user-role">({user?.role || 'Sin rol'})</span>
```

**Descripción**: Ahora el header muestra:
- **Nombre principal**: `full_name` (si existe), fallback a `username`
- **Rol**: Muestra el rol del usuario (Administrador, Orientador, etc.)

---

### 2. **AddUserModal.jsx** ✅
**Ubicación**: `siaesistema/src/components/Users/AddUserModal.jsx`

**Cambios realizados**:

#### a) Agregado estado para rol
```jsx
const [role, setRole] = useState('Docente'); // Rol por defecto
```

#### b) Selector de rol en el formulario
```jsx
<h3 className="form-section-title">Rol del Usuario</h3>
<div className="modal-input-group">
    <label htmlFor="role">Selecciona el rol:</label>
    <select id="role" value={role} onChange={e => setRole(e.target.value)} required>
        <option value="Administrador">Administrador</option>
        <option value="Orientador">Orientador</option>
        <option value="Prefecto">Prefecto</option>
        <option value="Docente">Docente</option>
    </select>
</div>
```

#### c) Datos enviados al backend
```jsx
const newUserData = {
    username,
    full_name: fullName,  // ✅ Campo correcto
    password,
    role,                 // ✅ Rol seleccionado (no full_name)
    permissions,
};
```

**Descripción**: El modal ahora:
- ✅ Envía `full_name` correctamente al backend
- ✅ Permite seleccionar el rol del usuario (Administrador, Orientador, Prefecto, Docente)
- ✅ Rol por defecto: "Docente"

---

### 3. **UserPermissionCard.jsx** ✅
**Ubicación**: `siaesistema/src/components/Users/UserPermissionCard.jsx`

**Estado actual** (ya estaba correcto):
```jsx
<h3 className="user-name">{user.full_name || user.username}</h3>
<span className="user-role-badge">{user.role}</span>
<span className="user-username">{user.username}</span>
```

**Descripción**: La card muestra:
- **Título principal**: `full_name` (si existe), fallback a `username`
- **Badge de rol**: El rol del usuario
- **Username**: Muestra el username sin el símbolo @

---

### 4. **UnauthorizedPage.jsx** ✅
**Ubicación**: `siaesistema/src/components/Auth/UnauthorizedPage.jsx`

**Cambio realizado**:
```jsx
// ANTES
<strong>{user?.username}</strong>

// DESPUÉS
<strong>{user?.full_name || user?.username}</strong>
```

**Descripción**: La página de acceso no autorizado ahora muestra el nombre completo del usuario.

---

### 5. **DeleteUserSelectModal.jsx** ✅
**Ubicación**: `siaesistema/src/components/Users/DeleteUserSelectModal.jsx`

**Estado actual** (ya estaba correcto):
```jsx
{user.full_name || user.username} ({user.role})
```

---

### 6. **GestionUsuariosPage.jsx** ✅
**Ubicación**: `siaesistema/src/pages/GestionUsuariosPage.jsx`

**Estado actual** (ya estaba correcto):
```jsx
showSuccess(`Usuario "${createdUser.full_name || createdUser.username}" creado exitosamente`);
```

---

### 7. **AuthContext.jsx** ✅
**Ubicación**: `siaesistema/src/components/Auth/AuthContext.jsx`

**Estado actual**: Ya configurado correctamente. El contexto:
- ✅ Llama a `/users/me` para obtener datos del usuario
- ✅ Guarda automáticamente el campo `full_name` en el estado `user`
- ✅ El campo está disponible en toda la app mediante `user?.full_name`

---

## Flujo Completo de Datos

### 1. **Creación de Usuario**
```
AddUserModal → 
  { username, full_name, password, role, permissions } → 
    Backend API POST /users → 
      Base de datos (usuarios table) → 
        Respuesta con usuario creado →
          GestionUsuariosPage actualiza lista
```

### 2. **Login**
```
LoginPage → 
  POST /login (username, password) → 
    Backend retorna token → 
      GET /users/me → 
        { id, username, full_name, role, permissions } → 
          AuthContext guarda en estado `user` → 
            Disponible en toda la app
```

### 3. **Visualización**
```jsx
// En cualquier componente
import { useAuth } from './components/Auth/AuthContext';

const { user } = useAuth();

// Mostrar nombre completo con fallback
{user?.full_name || user?.username}
```

---

## Compatibilidad con Usuarios Existentes

### Usuarios sin `full_name`
Los usuarios creados antes de esta actualización tendrán `full_name = NULL` en la base de datos.

**El frontend maneja esto correctamente**:
```jsx
{user?.full_name || user?.username}
```
- Si `full_name` es `null` → Muestra `username`
- Si `full_name` existe → Muestra `full_name`

### Actualizar Usuarios Existentes

Para agregar `full_name` a usuarios existentes:

1. **Desde la base de datos**:
```sql
UPDATE usuarios 
SET full_name = 'Nombre Completo' 
WHERE username = 'admin';
```

2. **Desde la UI** (cuando implementes edición de usuarios):
   - Agrega un modal de edición con campo `full_name`
   - Llama a `PUT /users/{user_id}` con el nuevo valor

---

## Estructura Final de Usuario

### En el Frontend
```javascript
{
  id: 1,
  username: "admin",
  full_name: "Administrador del Sistema", // ✅ Nuevo campo
  role: "Administrador",
  permissions: {
    canViewDashboard: true,
    canManageAlerts: true,
    canEditStudents: true,
    canManageUsers: true
  }
}
```

### En el Backend (PostgreSQL)
```sql
Table "usuarios"
  Column        |   Type   | Nullable
----------------+----------+----------
 id             | integer  | NOT NULL (PK)
 username       | varchar  | NOT NULL (UNIQUE)
 hashed_password| varchar  | NOT NULL
 full_name      | varchar  | NULL      ✅ Nuevo campo
 role           | varchar  | NOT NULL
 permissions    | jsonb    | NOT NULL
```

---

## Checklist de Verificación ✅

- [x] Backend actualizado con columna `full_name`
- [x] Migración ejecutada en base de datos
- [x] Backend reiniciado
- [x] Header muestra `full_name` correctamente
- [x] AddUserModal envía `full_name` al crear usuario
- [x] AddUserModal incluye selector de rol
- [x] UserPermissionCard muestra `full_name` con fallback
- [x] UnauthorizedPage usa `full_name`
- [x] AuthContext recibe y guarda `full_name`
- [x] Todos los componentes usan fallback `full_name || username`

---

## Siguiente Paso Recomendado

### Implementar Edición de Usuarios
Crear un modal `EditUserModal.jsx` que permita:
- Editar `full_name`
- Cambiar `role`
- Modificar permisos
- Cambiar contraseña (opcional)

```jsx
// Ejemplo de estructura
const EditUserModal = ({ isOpen, onClose, user, onUpdate }) => {
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [role, setRole] = useState(user?.role || 'Docente');
  // ... resto del formulario
};
```

---

## Notas Finales

1. **Compatibilidad**: Todos los cambios son retrocompatibles con usuarios existentes
2. **Fallback**: Siempre se usa `full_name || username` para garantizar que se muestre algo
3. **Validación**: El campo `full_name` es opcional (nullable) en la base de datos
4. **Frontend listo**: No se requieren más cambios en el frontend para usar `full_name`
