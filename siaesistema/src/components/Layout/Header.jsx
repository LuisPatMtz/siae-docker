// src/components/Layout/Header.jsx
import React from 'react';
import { useAuth } from '../Auth/AuthContext';
import { LogOut, Menu } from 'lucide-react';

const Header = ({ onMenuClick, isCollapsed }) => {
  const { logout, user } = useAuth();

  return (
    <header className={`header ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      <div className="header-content">
        
        <div className="header-left">
          <button className="menu-button" onClick={onMenuClick} title="Abrir menú">
            <Menu size={24} />
          </button>
          
          <div className="logo-container">
            <span className="logo">SIAE</span>
          </div>
        </div>

        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{user?.full_name || user?.username || 'Usuario'}</span>
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