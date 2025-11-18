// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Estilos modularizados
import './styles/variables.css'    // Variables globales y reset
import './styles/layout.css'       // Header, nav, containers
import './styles/components.css'   // Componentes reutilizables
import './styles/dashboard.css'    // Dashboard y páginas específicas
import './styles/students.css'     // Gestión de estudiantes y breadcrumbs
import './styles/toast.css'        // Sistema de notificaciones
import './pages/Login_Y_Loading_Styles.css'  // Estilos de Login y Loading
import './index.css'               // Estilos legacy y Login

import { AuthProvider } from './components/Auth/AuthContext.jsx'
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)