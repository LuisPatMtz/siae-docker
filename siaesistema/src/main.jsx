// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import{AuthProvider} from './components/Auth/AuthContext.jsx'

// 1. Importamos el BrowserRouter
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter> {/* Envuelve tu App con el Router */}
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)