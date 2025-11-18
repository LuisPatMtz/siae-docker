// src/components/Layout/Header.jsx
import React from 'react';
import { useAuth } from '../Auth/AuthContext';
import { LogOut, Menu } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';

const Header = ({ onMenuClick }) => {
  const { logout, user } = useAuth();
  const pageTitle = usePageTitle();

  return (
    <header className="header">
      <div className="header-content">
        
        <div className="header-left">
          <button className="menu-button" onClick={onMenuClick} title="Abrir menú">
            <Menu size={24} />
          </button>
          
          <div className="logo-container">
            <span className="logo">SIAE</span>
          </div>

          <div className="page-title-header">
            <h1>{pageTitle}</h1>
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