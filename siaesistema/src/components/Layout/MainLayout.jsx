// src/components/Layout/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';

const MainLayout = () => {
  return (
    <>
      <Header />
      {/* <Outlet> renderizará la página actual (ej. DashboardPage o AlertasPage) */}
      <Outlet />
    </>
  );
};

export default MainLayout;