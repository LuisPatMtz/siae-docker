// src/components/Auth/UnauthorizedPage.jsx
import React from 'react';
import { useAuth } from './AuthContext';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
    const { user, hasPermission } = useAuth();
    const navigate = useNavigate();

    // Función para encontrar la primera página disponible
    const getFirstAvailablePage = () => {
        if (hasPermission('canViewDashboard')) return '/';
        if (hasPermission('canManageAlerts')) return '/alertas';
        if (hasPermission('canEditStudents')) return '/estudiantes';
        if (hasPermission('canManageUsers')) return '/usuarios';
        return '/login'; // Si no tiene permisos, volver al login
    };

    const handleGoBack = () => {
        const firstAvailablePage = getFirstAvailablePage();
        navigate(firstAvailablePage);
    };

    return (
        <main className="dashboard-main">
            <div className="unauthorized-container">
                <div className="unauthorized-content">
                    <ShieldX size={80} className="unauthorized-icon" />
                    <h1 className="unauthorized-title">Acceso No Autorizado</h1>
                    <p className="unauthorized-message">
                        Lo sentimos, <strong>{user?.username}</strong>. No tienes permisos 
                        para acceder a esta sección del sistema.
                    </p>
                    <p className="unauthorized-role">
                        Tu rol actual: <span className="role-badge">{user?.role || 'Sin rol'}</span>
                    </p>
                    <div className="unauthorized-actions">
                        <button onClick={handleGoBack} className="action-button go-back-button">
                            <ArrowLeft size={18} />
                            Volver a una página disponible
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default UnauthorizedPage;