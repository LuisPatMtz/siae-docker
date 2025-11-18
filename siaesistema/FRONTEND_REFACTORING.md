# 🎨 Guía de Refactorización Frontend - SIAE

## 📋 Resumen

Refactorización ligera del frontend para mejorar mantenibilidad sin reescribir todo.

---

## 🎯 Problemas Actuales

1. **Dashboard.css con 8200+ líneas** - Bomba de tiempo, imposible de mantener
2. **services.js centralizado** - 370+ líneas, difícil de navegar
3. **Componentes sin reutilización** - Código duplicado de modales, botones, etc.
4. **Hooks básicos** - Falta abstracción para estados comunes (loading, error)

---

## 📁 Nueva Estructura Propuesta

```
siaesistema/src/
├── api/
│   ├── axios.js              # ✅ Ya existe - baseURL, interceptores
│   ├── index.js              # ✅ NUEVO - Exports centralizados
│   ├── authApi.js            # ✅ CREADO
│   ├── usersApi.js           # ✅ CREADO
│   ├── ciclosApi.js          # ✅ CREADO
│   ├── gruposApi.js          # ⏳ PENDIENTE
│   ├── estudiantesApi.js    # ⏳ PENDIENTE
│   ├── nfcApi.js             # ⏳ PENDIENTE
│   ├── accesosApi.js         # ⏳ PENDIENTE
│   ├── faltasApi.js          # ⏳ PENDIENTE
│   ├── dashboardApi.js       # ⏳ PENDIENTE
│   └── services.js           # 🔄 DEPRECAR gradualmente
│
├── context/
│   ├── AuthContext.jsx       # ✅ Ya existe
│   └── PermissionsContext.jsx  # ⏳ OPCIONAL - extraer permisos
│
├── hooks/
│   ├── usePermissions.js     # ✅ Ya existe
│   ├── useEscapeKey.js       # ✅ Ya existe
│   ├── useApiState.js        # ⏳ NUEVO - loading/error/data
│   ├── useDashboardFilters.js  # ⏳ NUEVO - lógica de filtros
│   └── useModal.js           # ⏳ NUEVO - abrir/cerrar modales
│
├── pages/
│   ├── LoginPage.jsx         # ✅ Ya existe
│   ├── DashboardPage.jsx
│   ├── GestionEstudiantesPage.jsx
│   ├── GestionUsuariosPage.jsx
│   ├── AlertasPage.jsx
│   └── RegistroAccesoPage.jsx
│
├── components/
│   ├── common/               # ⏳ NUEVO - Componentes reutilizables
│   │   ├── Button.jsx
│   │   ├── Modal.jsx
│   │   ├── Card.jsx
│   │   ├── Badge.jsx
│   │   ├── Input.jsx
│   │   └── Table.jsx
│   ├── Layout/               # ✅ Ya existe
│   │   ├── Header.jsx
│   │   └── MainLayout.jsx
│   ├── Dashboard/            # ✅ Ya existe
│   ├── Alerts/               # ✅ Ya existe
│   ├── Students/             # ✅ Ya existe
│   ├── Groups/               # ✅ Ya existe
│   ├── SchoolCycles/         # ✅ Ya existe
│   └── Users/                # ✅ Ya existe
│
└── styles/
    ├── index.css             # ✅ Ya existe - Entry point
    ├── base.css              # ⏳ NUEVO - Reset, variables, fuentes
    ├── layout.css            # ⏳ NUEVO - Header, nav, containers
    ├── components.css        # ⏳ NUEVO - Botones, cards, modales genéricos
    ├── dashboard.css         # 🔄 REDUCIR - Solo estilos específicos del dashboard
    ├── students.css          # ⏳ NUEVO - Específicos de estudiantes
    ├── alerts.css            # ⏳ NUEVO - Específicos de alertas
    └── login.css             # ⏳ NUEVO - Específicos de login
```

---

## 🔧 Fase 1: APIs Modularizadas (EN PROGRESO)

### ✅ Completado

1. **`authApi.js`** - Login y getMe
2. **`usersApi.js`** - CRUD de usuarios
3. **`ciclosApi.js`** - CRUD de ciclos escolares
4. **`index.js`** - Exportaciones centralizadas

### ⏳ Pendientes

Crear archivos similares para:

**`gruposApi.js`**
```javascript
import apiClient from './axios';

export const gruposService = {
    getAll: async () => {
        const response = await apiClient.get('/grupos');
        return response.data;
    },
    
    getById: async (grupoId) => { /* ... */ },
    create: async (grupoData) => { /* ... */ },
    update: async (grupoId, grupoData) => { /* ... */ },
    delete: async (grupoId) => { /* ... */ }
};

export default gruposService;
```

**`estudiantesApi.js`**
```javascript
import apiClient from './axios';

export const estudiantesService = {
    getAll: async () => { /* ... */ },
    getByMatricula: async (matricula) => { /* ... */ },
    getByGrupo: async (grupoId) => { /* ... */ },
    getByCiclo: async (cicloId) => { /* ... */ },
    create: async (estudianteData) => { /* ... */ },
    update: async (matricula, estudianteData) => { /* ... */ },
    uploadCSV: async (file) => { /* ... */ },
    bulkMoveGroup: async (matriculas, nuevoIdGrupo) => { /* ... */ },
    delete: async (matricula) => { /* ... */ }
};

export default estudiantesService;
```

**`nfcApi.js`**
```javascript
import apiClient from './axios';

export const nfcService = {
    getAll: async () => { /* ... */ },
    getByUID: async (nfcUid) => { /* ... */ },
    getByEstudiante: async (matricula) => { /* ... */ },
    vincular: async (nfcData) => { /* ... */ },
    create: async (nfcData) => { /* ... */ },
    delete: async (nfcUid) => { /* ... */ },
    deleteByEstudiante: async (matricula) => { /* ... */ }
};

export default nfcService;
```

**`accesosApi.js`**
```javascript
import apiClient from './axios';

export const accesosService = {
    registrar: async (nfcUid, fechaRegistro = null) => {
        const payload = { nfc_uid: nfcUid };
        if (fechaRegistro) {
            payload.fecha_registro = fechaRegistro;
        }
        const response = await apiClient.post('/acceso/registrar', payload);
        return response.data;
    },
    
    getByMatricula: async (matricula) => { /* ... */ },
    getByCiclo: async (cicloId) => { /* ... */ },
    verificarAccesoHoy: async (nfcUid, cicloId) => { /* ... */ }
};

export default accesosService;
```

**`faltasApi.js`**
```javascript
import apiClient from './axios';

export const faltasService = {
    getAll: async (filtros = {}) => { /* ... */ },
    getById: async (faltaId) => { /* ... */ },
    getByEstudiante: async (matricula, cicloId = null) => { /* ... */ },
    getByCiclo: async (cicloId, estado = null) => { /* ... */ },
    create: async (faltaData) => { /* ... */ },
    update: async (faltaId, faltaData) => { /* ... */ },
    justificar: async (faltaId, justificacion) => { /* ... */ },
    delete: async (faltaId) => { /* ... */ }
};

export default faltasService;
```

**`dashboardApi.js`**
```javascript
import apiClient from './axios';

export const dashboardService = {
    getStats: async (periodo, turno = 'Todos') => {
        const response = await apiClient.get('/dashboard/stats', {
            params: { periodo, turno }
        });
        return response.data;
    },
    
    getGroupAttendance: async (grupoId, periodo) => {
        const response = await apiClient.get(`/dashboard/group-attendance/${grupoId}`, {
            params: { periodo }
        });
        return response.data;
    },
    
    getStudentAttendanceDetail: async (matricula, periodo) => {
        const response = await apiClient.get(`/dashboard/student-attendance/${matricula}`, {
            params: { periodo }
        });
        return response.data;
    }
};

export default dashboardService;
```

---

## 🎨 Fase 2: División de Dashboard.css

### Estrategia

Dividir las 8200 líneas en archivos temáticos:

**`base.css`** (~500 líneas)
- Variables CSS (`:root`)
- Reset y normalización
- Fuentes (Google Fonts)
- Clases utilitarias globales

**`layout.css`** (~800 líneas)
- `.header`, `.nav`
- `.dashboard-main`
- `.page-container`
- Grid y flex layouts generales

**`components.css`** (~1500 líneas)
- `.btn` y variantes
- `.card` y variantes
- `.modal-overlay`, `.modal-content`
- `.input`, `.form-input`
- `.badge` y estados
- `.table` genérica

**`dashboard.css`** (~1200 líneas) - **REDUCIDO**
- Específicos del dashboard
- `.stats-card`
- `.student-groups-nav`
- `.group-attendance-card`
- Gráficas y visualizaciones

**`students.css`** (~900 líneas)
- `.student-management-container`
- `.student-form-card`
- `.student-table`
- Gestión de grupos
- Vinculación NFC

**`alerts.css`** (~600 líneas)
- `.alerts-table`
- `.alert-row` y estados
- Modal de justificación
- Historial

**`login.css`** (~400 líneas)
- `.login-container`
- `.login-card`
- Animaciones de login

**`registro-acceso.css`** (~300 líneas)
- `.registro-acceso-container`
- `.acceso-panel`
- `.modo-prueba-panel`

### Implementación

1. **Crear archivos nuevos**
2. **Copiar secciones del Dashboard.css**
3. **Importar en orden en `index.css`**:

```css
/* index.css - Entry point */
@import './base.css';
@import './layout.css';
@import './components.css';
@import './dashboard.css';
@import './students.css';
@import './alerts.css';
@import './login.css';
@import './registro-acceso.css';
```

4. **Probar que todo funcione**
5. **Eliminar Dashboard.css viejo**

---

## 🧩 Fase 3: Componentes Comunes

### Crear `components/common/`

**`Button.jsx`**
```jsx
/**
 * Botón reutilizable con variantes
 * @param {string} variant - primary | secondary | success | danger
 * @param {string} size - sm | md | lg
 * @param {boolean} loading - Muestra spinner
 */
export const Button = ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    disabled = false,
    onClick,
    type = 'button',
    ...props 
}) => {
    const className = `btn btn-${variant} btn-${size} ${loading ? 'loading' : ''}`;
    
    return (
        <button 
            type={type}
            className={className}
            disabled={disabled || loading}
            onClick={onClick}
            {...props}
        >
            {loading ? <span className="spinner" /> : children}
        </button>
    );
};
```

**`Modal.jsx`**
```jsx
import { useEscapeKey } from '../../hooks/useEscapeKey';

export const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    size = 'md',  // sm | md | lg | xl
    showCloseButton = true 
}) => {
    useEscapeKey(onClose);
    
    if (!isOpen) return null;
    
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                className={`modal-content modal-${size}`} 
                onClick={(e) => e.stopPropagation()}
            >
                {showCloseButton && (
                    <button className="modal-close" onClick={onClose}>×</button>
                )}
                {title && <h2 className="modal-title">{title}</h2>}
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
};
```

**`Card.jsx`**
```jsx
export const Card = ({ 
    children, 
    title, 
    className = '',
    variant = 'default',  // default | glass | elevated
    ...props 
}) => {
    return (
        <div className={`card card-${variant} ${className}`} {...props}>
            {title && <h3 className="card-title">{title}</h3>}
            <div className="card-content">{children}</div>
        </div>
    );
};
```

**`Badge.jsx`**
```jsx
export const Badge = ({ 
    children, 
    variant = 'default',  // default | success | warning | error | info
    size = 'md'  // sm | md | lg
}) => {
    return (
        <span className={`badge badge-${variant} badge-${size}`}>
            {children}
        </span>
    );
};
```

**`Input.jsx`**
```jsx
import { forwardRef } from 'react';

export const Input = forwardRef(({ 
    label, 
    error, 
    helperText,
    required = false,
    ...props 
}, ref) => {
    return (
        <div className="input-group">
            {label && (
                <label className="input-label">
                    {label}
                    {required && <span className="required">*</span>}
                </label>
            )}
            <input 
                ref={ref}
                className={`input ${error ? 'input-error' : ''}`}
                {...props}
            />
            {helperText && <span className="input-helper">{helperText}</span>}
            {error && <span className="input-error-message">{error}</span>}
        </div>
    );
});
```

---

## 🪝 Fase 4: Hooks Útiles

### `useApiState.js`
```javascript
import { useState } from 'react';

/**
 * Hook para manejar estados comunes de API calls
 * @returns {Object} { data, loading, error, setData, setLoading, setError, reset }
 */
export const useApiState = (initialData = null) => {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const reset = () => {
        setData(initialData);
        setLoading(false);
        setError(null);
    };
    
    return {
        data,
        loading,
        error,
        setData,
        setLoading,
        setError,
        reset
    };
};

// Uso:
// const { data, loading, error, setData, setLoading, setError } = useApiState([]);
```

### `useModal.js`
```javascript
import { useState } from 'react';

/**
 * Hook para manejar estado de modales
 * @returns {Object} { isOpen, open, close, toggle }
 */
export const useModal = (initialState = false) => {
    const [isOpen, setIsOpen] = useState(initialState);
    
    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    const toggle = () => setIsOpen(prev => !prev);
    
    return { isOpen, open, close, toggle };
};

// Uso:
// const modal = useModal();
// <Modal isOpen={modal.isOpen} onClose={modal.close}>...</Modal>
```

### `useDashboardFilters.js`
```javascript
import { useState } from 'react';

/**
 * Hook para manejar filtros del dashboard
 * @returns {Object} Filtros y funciones para actualizarlos
 */
export const useDashboardFilters = () => {
    const [periodo, setPeriodo] = useState('hoy');
    const [turno, setTurno] = useState('Todos');
    const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
    
    const resetFilters = () => {
        setPeriodo('hoy');
        setTurno('Todos');
        setGrupoSeleccionado(null);
    };
    
    return {
        periodo,
        turno,
        grupoSeleccionado,
        setPeriodo,
        setTurno,
        setGrupoSeleccionado,
        resetFilters
    };
};
```

---

## 🔄 Plan de Migración

### Opción Recomendada: Gradual

1. **Semana 1**: APIs
   - ✅ Crear archivos modulares
   - ✅ Exportar desde `index.js`
   - ⏳ Actualizar imports en componentes (uno por uno)

2. **Semana 2**: CSS
   - Crear archivos nuevos
   - Copiar secciones
   - Probar cada archivo
   - Importar en `index.css`

3. **Semana 3**: Componentes Comunes
   - Crear `Button`, `Modal`, `Card`
   - Refactorizar componentes que los usen
   - Eliminar duplicados

4. **Semana 4**: Hooks
   - Crear hooks útiles
   - Refactorizar componentes para usarlos
   - Limpiar código duplicado

---

## ✅ Checklist de Refactorización

### APIs
- [x] authApi.js
- [x] usersApi.js
- [x] ciclosApi.js
- [ ] gruposApi.js
- [ ] estudiantesApi.js
- [ ] nfcApi.js
- [ ] accesosApi.js
- [ ] faltasApi.js
- [ ] dashboardApi.js
- [ ] Actualizar imports en componentes

### CSS
- [ ] Crear base.css
- [ ] Crear layout.css
- [ ] Crear components.css
- [ ] Reducir dashboard.css
- [ ] Crear students.css
- [ ] Crear alerts.css
- [ ] Crear login.css
- [ ] Crear registro-acceso.css
- [ ] Importar en index.css
- [ ] Eliminar Dashboard.css viejo

### Componentes
- [ ] Button.jsx
- [ ] Modal.jsx
- [ ] Card.jsx
- [ ] Badge.jsx
- [ ] Input.jsx
- [ ] Table.jsx
- [ ] Refactorizar componentes existentes

### Hooks
- [ ] useApiState.js
- [ ] useModal.js
- [ ] useDashboardFilters.js
- [ ] Refactorizar componentes existentes

---

## 📊 Beneficios

### Antes
- ❌ Dashboard.css: 8200 líneas inmanejables
- ❌ services.js: 370 líneas difíciles de navegar
- ❌ Código duplicado en modales/botones
- ❌ Difícil encontrar estilos específicos

### Después
- ✅ CSS dividido en 8 archivos temáticos (~1000 líneas c/u)
- ✅ APIs organizadas por dominio (30-80 líneas c/u)
- ✅ Componentes reutilizables (DRY)
- ✅ Hooks para lógica común
- ✅ Fácil de mantener y escalar
- ✅ Onboarding más rápido para nuevos devs

---

**Fecha**: 16 de Noviembre, 2025  
**Versión**: 1.0  
**Estado**: APIs en progreso (3/9 completadas)

