# Instrucciones: Aplicar Estilos Premium a Página de Usuarios

## Archivo: `GestionUsuariosPage.jsx`

### Paso 1: Agregar Import CSS (Línea 3)

**Después de la línea 2:**
```javascript
import apiClient from '../api/axios'; // Importa tu cliente Axios
```

**Agregar:**
```javascript
import '../styles/GestionUsuariosPage.css'; // Estilos premium
```

---

### Paso 2: Actualizar Header (Líneas 221-229)

**Buscar:**
```javascript
            <div className="page-actions-bar">
                <p className="page-subtitle">
                    Asigna o revoca permisos a los perfiles de usuario que acceden al sistema.
                </p>
                <button className="action-button add-button" onClick={openAddUserModal}>
                    <PlusCircle size={18} />
                    Agregar Usuario
                </button>
            </div>
```

**Reemplazar con:**
```javascript
            <div className="users-page-header">
                <h1 className="users-page-title">Gestión de Usuarios</h1>
                <p className="users-page-subtitle">
                    Asigna o revoca permisos a los perfiles de usuario que acceden al sistema.
                </p>
                <div className="users-header-actions">
                    <button className="users-btn users-btn-primary" onClick={openAddUserModal}>
                        <PlusCircle size={18} />
                        Agregar Usuario
                    </button>
                </div>
            </div>
```

---

### Paso 3: Actualizar Grid de Usuarios (Líneas 231-249)

**Buscar:**
```javascript
            {isLoading ? (
                <div className="loading-message">Cargando usuarios...</div>
            ) : (
                <div className="user-cards-grid">
                    {users.length > 0 ? (
                        users.map(user => (
                            <UserPermissionCard
                                key={`user-${user.id}-${user.username}`}
                                user={user}
                                onPermissionChange={handlePermissionChange}
                                onDelete={handleIndividualDelete}
                                onEdit={openEditUserModal}
                            />
                        ))
                    ) : (
                        <p>No se encontraron usuarios. Puedes agregar uno para comenzar.</p>
                    )}
                </div>
            )}
```

**Reemplazar con:**
```javascript
            {isLoading ? (
                <div className="loading-message">Cargando usuarios...</div>
            ) : users.length > 0 ? (
                <div className="users-grid-container">
                    {users.map(user => (
                        <UserPermissionCard
                            key={`user-${user.id}-${user.username}`}
                            user={user}
                            onPermissionChange={handlePermissionChange}
                            onDelete={handleIndividualDelete}
                            onEdit={openEditUserModal}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <h3>No hay usuarios registrados</h3>
                    <p>Comienza agregando tu primer usuario al sistema</p>
                    <button className="users-btn users-btn-primary" onClick={openAddUserModal}>
                        <PlusCircle size={18} />
                        Agregar Primer Usuario
                    </button>
                </div>
            )}
```

---

## ¡Listo!

Después de hacer estos 3 cambios, guarda el archivo y verifica en el navegador. La página de usuarios ahora tendrá:

✅ Header con gradiente azul  
✅ Cards con glassmorphism  
✅ Efectos hover suaves  
✅ Empty state mejorado  
✅ Diseño responsive
