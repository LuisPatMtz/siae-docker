// src/components/Layout/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  GraduationCap,
  ClipboardList,
  History,
  CheckCircle,
  Scissors,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Database
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, isCollapsed, toggleCollapse, isMobile }) => {
  const { hasPermission, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Cerrar sidebar al hacer click en un link en móvil
  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay para cerrar el sidebar en móvil */}
      {isMobile && isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed && !isMobile ? 'collapsed' : ''}`}>
        {/* Logo Section */}
        <div className="sidebar-logo-section">
          <span className="sidebar-logo">SIAE</span>
        </div>

        <div className="sidebar-header">
          <h2 className="sidebar-title">{!isCollapsed && 'Menú'}</h2>
          <div className="sidebar-header-buttons">
            {/* Botón toggle para colapsar/expandir (solo visible en desktop) */}
            {!isMobile && (
              <button className="sidebar-toggle" onClick={toggleCollapse} title={isCollapsed ? 'Expandir' : 'Colapsar'}>
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            )}
            {/* Botón cerrar (solo visible en móvil) */}
            {isMobile && (
              <button className="sidebar-close" onClick={onClose}>
                <X size={24} />
              </button>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* Dashboard */}
          {hasPermission('canViewDashboard') && (
            <NavLink
              to="/"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
              title="Dashboard"
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
          )}

          {/* Gestión de Alertas */}
          {hasPermission('canManageAlerts') && (
            <NavLink
              to="/alertas"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
              title="Gestión de Alertas"
            >
              <AlertTriangle size={20} />
              <span>Gestión de Alertas</span>
            </NavLink>
          )}

          {/* Gestión de Usuarios */}
          {hasPermission('canManageUsers') && (
            <NavLink
              to="/gestion-usuarios"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
              title="Gestión de Usuarios"
            >
              <Users size={20} />
              <span>Gestión de Usuarios</span>
            </NavLink>
          )}

          {/* Gestión de Estudiantes */}
          {hasPermission('canEditStudents') && (
            <NavLink
              to="/gestion-estudiantes"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
              title="Gestión de Estudiantes"
            >
              <GraduationCap size={20} />
              <span>Gestión de Estudiantes</span>
            </NavLink>
          )}

          {/* Registro de Accesos */}
          {hasPermission('canManageAttendance') && (
            <NavLink
              to="/registro-acceso"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
              title="Registro de Accesos"
            >
              <ClipboardList size={20} />
              <span>Registro de Accesos</span>
            </NavLink>
          )}

          {/* Historial de Asistencias */}
          {hasPermission('canViewDashboard') && (
            <NavLink
              to="/historial-asistencias"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
              title="Historial de Asistencias"
            >
              <History size={20} />
              <span>Historial de Asistencias</span>
            </NavLink>
          )}

          {/* Corte de Faltas */}
          {hasPermission('canManageAttendance') && (
            <NavLink
              to="/corte-faltas"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
              title="Corte de Faltas"
            >
              <Scissors size={20} />
              <span>Corte de Faltas</span>
            </NavLink>
          )}

          {/* Mantenimiento */}
          {hasPermission('canManageMaintenance') && (
            <NavLink
              to="/mantenimiento"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
              title="Mantenimiento"
            >
              <Database size={20} />
              <span>Mantenimiento</span>
            </NavLink>
          )}
        </nav>

        {/* User Info Section */}
        <div className="sidebar-user-section">
          <div className="sidebar-user-info">
            <div className="user-avatar">
              <User size={20} />
            </div>
            {!isCollapsed && (
              <div className="user-details">
                <div className="user-name">{user?.full_name || user?.username || 'Usuario'}</div>
                <div className="user-role">{user?.role || 'Sin rol'}</div>
              </div>
            )}
          </div>
          <button
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Salir</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
