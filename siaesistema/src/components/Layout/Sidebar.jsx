// src/components/Layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Users, 
  GraduationCap, 
  ClipboardList, 
  History,
  X 
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { hasPermission } = useAuth();

  return (
    <>
      {/* Overlay para cerrar el sidebar en móvil */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Menú</h2>
          <button className="sidebar-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {/* Dashboard */}
          {hasPermission('canViewDashboard') && (
            <NavLink 
              to="/"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
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
              onClick={onClose}
            >
              <AlertTriangle size={20} />
              <span>Gestión de Alertas</span>
            </NavLink>
          )}
          
          {/* Gestión de Usuarios */}
          {hasPermission('canManageUsers') && (
            <NavLink 
              to="/usuarios"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Users size={20} />
              <span>Gestión de Usuarios</span>
            </NavLink>
          )}
          
          {/* Gestión de Estudiantes */}
          {hasPermission('canEditStudents') && (
            <NavLink 
              to="/estudiantes"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <GraduationCap size={20} />
              <span>Gestión de Estudiantes</span>
            </NavLink>
          )}
          
          {/* Registro de Accesos */}
          <NavLink 
            to="/registro-acceso"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <ClipboardList size={20} />
            <span>Registro de Accesos</span>
          </NavLink>
          
          {/* Historial de Accesos */}
          {hasPermission('canViewDashboard') && (
            <NavLink 
              to="/historial-accesos"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <History size={20} />
              <span>Historial</span>
            </NavLink>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
