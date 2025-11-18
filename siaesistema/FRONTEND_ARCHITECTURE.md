# Frontend SIAE - Documentación de Arquitectura

## 📂 Estructura Modular

```
siaesistema/src/
├── api/                        # Servicios HTTP (1:1 con backend)
│   ├── axios.js               # Cliente Axios configurado
│   ├── authApi.js             # /login, /users/me
│   ├── usersApi.js            # /users CRUD
│   ├── studentsApi.js         # /estudiantes CRUD + CSV
│   ├── groupsApi.js           # /grupos CRUD
│   ├── cyclesApi.js           # /ciclos CRUD + activar
│   ├── accessApi.js           # /nfc + /acceso
│   ├── faultsApi.js           # /faltas CRUD + justificar
│   ├── dashboardApi.js        # /dashboard estadísticas
│   └── index.js               # Exportación centralizada
│
├── styles/                     # CSS modularizado
│   ├── variables.css          # Colores, spacing, shadows
│   ├── layout.css             # Header, nav, containers
│   ├── components.css         # Card, Modal, Button, Table, Tag
│   └── dashboard.css          # Dashboard, Alertas, Usuarios
│
├── components/                 # Componentes React
│   ├── UI/                    # Componentes reutilizables
│   │   ├── Card.jsx           # <Card title="..." />
│   │   ├── Modal.jsx          # <Modal isOpen onClose />
│   │   ├── Tag.jsx            # <Tag status="warning|danger|success" />
│   │   └── Toast.jsx          # Notificaciones
│   │
│   ├── Auth/                  # Autenticación
│   ├── Dashboard/             # Componentes Dashboard
│   ├── Alerts/                # Gestión de Alertas
│   ├── Students/              # Gestión de Estudiantes
│   ├── Groups/                # Gestión de Grupos
│   ├── SchoolCycles/          # Gestión de Ciclos
│   ├── Users/                 # Gestión de Usuarios
│   └── Layout/                # Header, MainLayout
│
├── hooks/                      # Custom hooks
│   ├── useEscapeKey.js        # Cerrar modales con Esc
│   └── usePermissions.js      # Chequeo de permisos
│
└── pages/                      # Páginas principales
    ├── LoginPage.jsx
    ├── DashboardPage.jsx
    ├── AlertasPage.jsx
    ├── GestionEstudiantesPage.jsx
    └── GestionUsuariosPage.jsx
```

## 🎨 Sistema de Estilos

### Variables CSS (variables.css)
```css
/* Colores principales */
--siae-primary-blue: #4A90E2
--siae-dark-blue: #2C5282
--siae-success: #10B981
--siae-warning: #F59E0B
--siae-error: #EF4444

/* Spacing */
--siae-spacing-xs: 4px
--siae-spacing-sm: 8px
--siae-spacing-md: 16px
--siae-spacing-lg: 24px
--siae-spacing-xl: 32px
--siae-spacing-2xl: 48px

/* Sombras */
--siae-shadow-sm
--siae-shadow-md
--siae-shadow-lg
--siae-shadow-glow-blue

/* Transiciones */
--siae-transition-fast: 150ms ease
--siae-transition-base: 200ms ease
```

### Layout (layout.css)
- `.header` - Barra superior sticky
- `.nav` - Navegación horizontal con tabs
- `.page-container` - Contenedor principal
- `.page-title` + `.title-decorator` - Título de página

### Componentes (components.css)
- `.card` - Tarjeta con hover
- `.btn-primary`, `.btn-success`, `.btn-danger` - Botones
- `.table` - Tablas con header gradient
- `.badge`, `.tag` - Etiquetas de estado
- `.modal-overlay` + `.modal-content` - Modales

### Dashboard (dashboard.css)
- `.stats-card` - Tarjeta con círculo de estadísticas
- `.group-btn` - Botones de grupos
- `.alert-row` - Filas de alertas
- `.user-card` - Tarjetas de permisos de usuarios

## 🧩 Componentes Reutilizables

### `<Card />`
```jsx
import Card from './components/UI/Card';

<Card title="Título" hoverable>
  <p>Contenido de la card</p>
</Card>
```

**Props:**
- `title` (string, opcional) - Título de la card
- `children` (ReactNode) - Contenido
- `className` (string) - Clases adicionales
- `hoverable` (bool) - Efecto hover (default: true)
- `onClick` (func) - Handler de click

### `<Modal />`
```jsx
import Modal from './components/UI/Modal';

<Modal 
  isOpen={isOpen} 
  onClose={handleClose} 
  title="Título del Modal"
  size="md"
>
  <p>Contenido del modal</p>
</Modal>
```

**Props:**
- `isOpen` (bool) - Controla visibilidad
- `onClose` (func) - Callback para cerrar
- `title` (string) - Título
- `size` (string) - 'sm' | 'md' | 'lg' | 'xl'
- `showCloseButton` (bool) - Mostrar X (default: true)

**Features:**
- ✅ Cierra con tecla Escape
- ✅ Previene scroll del body
- ✅ Click fuera para cerrar

### `<Tag />`
```jsx
import Tag, { getStatusFromFaltas } from './components/UI/Tag';

<Tag status="warning">3 Faltas</Tag>
<Tag status={getStatusFromFaltas(5)}>Peligro</Tag>
```

**Props:**
- `status` (string) - 'success' | 'warning' | 'danger' | 'info' | 'primary'
- `children` (ReactNode) - Texto
- `uppercase` (bool) - Transformar a mayúsculas (default: true)

**Helpers:**
- `getStatusFromFaltas(faltas)` - Retorna status según cantidad
- `getStatusFromEstado(estado)` - Retorna status según estado
- `getStatusFromPercentage(pct)` - Retorna status según %

## 🌐 API Services

### Naming: 1:1 con endpoints backend

```javascript
import { authApi, studentsApi, dashboardApi } from './api';

// Login
const { access_token } = await authApi.login(username, password);

// Estudiantes
const estudiantes = await studentsApi.getAll();
await studentsApi.create({ matricula, nombre, ... });
await studentsApi.uploadCSV(file);

// Dashboard
const stats = await dashboardApi.getTurnoData('matutino');
const grupoData = await dashboardApi.getGrupoData(grupoId, 'semester');
```

### Módulos disponibles:
| Módulo | Endpoints | Métodos principales |
|--------|-----------|---------------------|
| `authApi` | /login, /users/me | login(), getMe() |
| `usersApi` | /users | getAll(), create(), updatePermissions() |
| `studentsApi` | /estudiantes | getAll(), getByGrupo(), uploadCSV() |
| `groupsApi` | /grupos | getAll(), create(), update() |
| `cyclesApi` | /ciclos | getActivo(), activar(), create() |
| `accessApi` | /nfc, /acceso | vincularNFC(), registrarAcceso() |
| `faultsApi` | /faltas | getByEstudiante(), justificar() |
| `dashboardApi` | /dashboard | getTurnoData(), getGrupoData() |

### Exportación centralizada:
```javascript
// Importar individualmente
import { studentsApi } from './api';

// O como objeto
import api from './api';
api.students.getAll();
```

## 🎯 Uso de Componentes en Páginas

### Refactorización de AlertasPage
```jsx
import Card from '../components/UI/Card';
import Tag, { getStatusFromFaltas } from '../components/UI/Tag';

function AlertasPage() {
  return (
    <Card title="Alertas de Asistencia">
      {estudiantes.map(est => (
        <div key={est.matricula}>
          <span>{est.nombre}</span>
          <Tag status={getStatusFromFaltas(est.faltas)}>
            {est.faltas} Faltas
          </Tag>
        </div>
      ))}
    </Card>
  );
}
```

### Refactorización de DashboardPage
```jsx
import Card from '../components/UI/Card';
import Tag from '../components/UI/Tag';
import { dashboardApi } from '../api';

function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dashboardApi.getTurnoData('general').then(setStats);
  }, []);

  return (
    <div className="widgets-grid">
      <Card title="Estadísticas del Día" hoverable>
        <div className="stats-circle">
          <span className="stats-circle-number">{stats?.asistencias}</span>
          <span className="stats-circle-label">Asistencias</span>
        </div>
      </Card>
    </div>
  );
}
```

## 📱 Responsive Design

Todos los componentes y estilos son responsivos:

| Breakpoint | Ancho | Ajustes |
|------------|-------|---------|
| Mobile | < 640px | Header compacto, nav scroll horizontal |
| Tablet | 640-1024px | Grid 1 columna, spacing reducido |
| Desktop | > 1024px | Grid 2 columnas, spacing completo |

## 🚀 Migración Gradual

**Paso 1:** ✅ Separar CSS
- Dashboard.css → variables.css + layout.css + components.css + dashboard.css

**Paso 2:** ✅ Modularizar API
- services.js → 8 módulos (authApi, usersApi, studentsApi, etc.)

**Paso 3:** ✅ Crear componentes comunes
- Card, Modal, Tag creados

**Paso 4:** 🔄 Refactorizar páginas
- DashboardPage: Usar <Card>, <Tag>
- AlertasPage: Usar <Card>, <Tag>, <Modal>
- GestionEstudiantesPage: Usar <Card>, <Modal>

**Paso 5:** ⏳ Actualizar imports
- Cambiar `import { estudiantesService } from './api/services'` 
- Por `import { studentsApi } from './api'`

## ✅ Ventajas de la Nueva Arquitectura

1. **CSS Modular**: Fácil de mantener y extender
2. **API 1:1**: Nombres coinciden con backend
3. **Componentes Reutilizables**: Menos código duplicado
4. **Type Safety**: PropTypes en componentes
5. **Hooks Custom**: Lógica reutilizable (useEscapeKey)
6. **Responsive**: Mobile-first design
7. **Accesibilidad**: ARIA labels, keyboard navigation
8. **Performance**: Lazy loading preparado

## 📝 Convenciones de Código

### Naming:
- **Componentes**: PascalCase (`Card.jsx`)
- **Hooks**: camelCase con prefijo `use` (`useEscapeKey.js`)
- **APIs**: camelCase con sufijo `Api` (`studentsApi.js`)
- **CSS**: kebab-case (`.card-title`)

### Estructura de archivos:
```
ComponentName/
├── ComponentName.jsx        # Componente principal
├── SubComponent.jsx         # Sub-componentes si aplica
└── componentName.test.js    # Tests (futuro)
```

### Imports ordenados:
```javascript
// 1. React y librerías externas
import React, { useState } from 'react';
import { X } from 'lucide-react';

// 2. APIs y hooks
import { studentsApi } from '../../api';
import useEscapeKey from '../../hooks/useEscapeKey';

// 3. Componentes
import Card from '../UI/Card';
import Modal from '../UI/Modal';

// 4. Estilos (si aplica)
import './styles.css';
```

---

**Versión**: 2.0.0  
**Fecha**: Noviembre 2025  
**Estado**: ✅ Arquitectura modular implementada
