import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext'; // Importamos el hook

const ProtectedRoute = () => {
  // Obtenemos el estado de autenticación y la carga inicial del contexto
  const { isAuthenticated, isAuthLoading } = useAuth();

  // 1. Si todavía estamos en la carga INICIAL, no mostramos nada
  // (esto evita la redirección antes de tiempo)
  if (isAuthLoading) {
    return null; // O un <Spinner /> global
  }

  // 2. Si la carga inicial terminó y NO está autenticado
  if (!isAuthenticated) {
    // Lo redirige a /login
    return <Navigate to="/login" replace />;
  }

  // 3. Si está autenticado, renderiza las rutas hijas
  return <Outlet />;
};

export default ProtectedRoute;