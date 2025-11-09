// src/components/Layout/Header.jsx
import React from 'react';
// 1. Importamos NavLink
import { NavLink } from 'react-router-dom';
// 2. Importamos el hook de autenticación
import { useAuth } from '../Auth/AuthContext';
// 3. Importamos iconos para el logout
import { LogOut } from 'lucide-react';

const Header = () => {
  // 4. Obtenemos la función de verificación de permisos y logout
  const { hasPermission, logout, user } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        
        <div className="header-left">
          <div className="logo-container">
            <span className="logo">SIAE</span>
          </div>

          {/* 5. Navegación con control de permisos */}
          <nav className="nav">
            {/* Dashboard - Solo si tiene permiso canViewDashboard */}
            {hasPermission('canViewDashboard') && (
              <NavLink 
                to="/"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                DASHBOARD
              </NavLink>
            )}
            
            {/* Gestión de Alertas - Solo si tiene permiso canManageAlerts */}
            {hasPermission('canManageAlerts') && (
              <NavLink 
                to="/alertas"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                GESTIÓN DE ALERTAS
              </NavLink>
            )}
            
            {/* Gestión de Usuarios - Solo si tiene permiso canManageUsers */}
            {hasPermission('canManageUsers') && (
              <NavLink 
                to="/usuarios"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                GESTIÓN DE USUARIOS
              </NavLink>
            )}
            
            {/* Gestión de Estudiantes - Solo si tiene permiso canEditStudents */}
            {hasPermission('canEditStudents') && (
              <NavLink 
                to="/estudiantes"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                GESTIÓN DE ESTUDIANTES
              </NavLink>
            )}
          </nav>
        </div>

        {/* 6. Sección derecha con información del usuario y logout */}
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{user?.username || 'Usuario'}</span>
            <span className="user-role">({user?.role || 'Sin rol'})</span>
          </div>
          <button onClick={logout} className="logout-button" title="Cerrar sesión">
            <LogOut size={20} />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;