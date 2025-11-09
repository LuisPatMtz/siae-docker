// src/components/Auth/PermissionRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import UnauthorizedPage from './UnauthorizedPage';

const PermissionRoute = ({ children, requiredPermission, showUnauthorized = true }) => {
    const { hasPermission, isAuthenticated, isAuthLoading } = useAuth();

    // Si aún está cargando la autenticación, no renderizamos nada
    if (isAuthLoading) {
        return null;
    }

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Si no tiene el permiso requerido
    if (!hasPermission(requiredPermission)) {
        // Mostrar página de no autorizado o redirigir según la configuración
        return showUnauthorized ? <UnauthorizedPage /> : <Navigate to="/" replace />;
    }

    // Si tiene el permiso, renderizar el componente hijo
    return children;
};

export default PermissionRoute;