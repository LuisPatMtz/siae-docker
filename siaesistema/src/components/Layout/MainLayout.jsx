// src/components/Layout/MainLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar.jsx';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // En desktop, asegurar que el sidebar no esté en modo "open" (overlay)
      if (!mobile) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="app-layout">
      {/* Mobile menu button */}
      {isMobile && (
        <button className="mobile-menu-button" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        isMobile={isMobile}
      />
      
      <main className={`main-content ${isCollapsed && !isMobile ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;