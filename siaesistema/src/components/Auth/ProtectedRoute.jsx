import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext'; // Importamos el hook

const ProtectedRoute = () => {
    const { isAuthenticated, isAuthLoading } = useAuth();

    console.log('[ProtectedRoute] isAuthLoading:', isAuthLoading);
    console.log('[ProtectedRoute] isAuthenticated:', isAuthenticated);

    // 1. Si todavía estamos en la carga INICIAL, no mostramos nada
    // (esto evita la redirección antes de tiempo)
    if (isAuthLoading) {
        console.log('[ProtectedRoute] Still loading, showing nothing');
        return null; // O un <Spinner /> global
    }

    // 2. Si la carga inicial terminó y NO está autenticado
    if (!isAuthenticated) {
        console.log('[ProtectedRoute] Not authenticated, redirecting to /login');
        // Lo redirige a /login
        return <Navigate to="/login" replace />;
    }

    // 3. Si está autenticado, renderiza las rutas hijas
    console.log('[ProtectedRoute] Authenticated, rendering protected content');
    return <Outlet />;
};

export default ProtectedRoute;