// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Importamos componentes de Layout y Auth
import MainLayout from './components/Layout/MainLayout.jsx';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import PermissionRoute from './components/Auth/PermissionRoute.jsx';
import { useAuth } from './components/Auth/AuthContext.jsx';

// Importamos las Páginas
import LoginPage from './pages/LoginPage.jsx';
import LoadingPage from './pages/LoadingPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AlertasPage from './pages/AlertasPage.jsx';
import GestionUsuariosPage from './pages/GestionUsuariosPage.jsx';
import GestionEstudiantesPage from './pages/GestionEstudiantesPage.jsx';

// Importamos nuestro CSS
import './Dashboard.css';

function App() {
    const { isAuthenticated, hasPermission } = useAuth();

    // Componente para manejar la redirección a la primera página disponible
    const DefaultRedirect = () => {
        if (hasPermission('canViewDashboard')) {
            return <Navigate to="/" replace />;
        } else if (hasPermission('canManageAlerts')) {
            return <Navigate to="/alertas" replace />;
        } else if (hasPermission('canEditStudents')) {
            return <Navigate to="/estudiantes" replace />;
        } else if (hasPermission('canManageUsers')) {
            return <Navigate to="/usuarios" replace />;
        } else {
            // Si no tiene ningún permiso, redirigir al login
            return <Navigate to="/login" replace />;
        }
    };

    return (
        <div className="app-container">
            <Routes>
                {/* Ruta 1: Login (Pública) */}
                <Route path="/login" element={<LoginPage />} />

                {/* Ruta 2: Carga (Pública) */}
                <Route path="/loading" element={<LoadingPage />} />

                {/* Ruta 3: Rutas Protegidas (Privadas) */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<MainLayout />}>
                        {/* Dashboard - Protegido por permiso canViewDashboard */}
                        <Route 
                            path="/" 
                            element={
                                <PermissionRoute requiredPermission="canViewDashboard">
                                    <DashboardPage />
                                </PermissionRoute>
                            } 
                        />
                        
                        {/* Gestión de Alertas - Protegido por permiso canManageAlerts */}
                        <Route 
                            path="/alertas" 
                            element={
                                <PermissionRoute requiredPermission="canManageAlerts">
                                    <AlertasPage />
                                </PermissionRoute>
                            } 
                        />
                        
                        {/* Gestión de Usuarios - Protegido por permiso canManageUsers */}
                        <Route 
                            path="/usuarios" 
                            element={
                                <PermissionRoute requiredPermission="canManageUsers">
                                    <GestionUsuariosPage />
                                </PermissionRoute>
                            } 
                        />
                        
                        {/* Gestión de Estudiantes - Protegido por permiso canEditStudents */}
                        <Route 
                            path="/estudiantes" 
                            element={
                                <PermissionRoute requiredPermission="canEditStudents">
                                    <GestionEstudiantesPage />
                                </PermissionRoute>
                            } 
                        />
                    </Route>
                </Route>

                {/* Ruta 4: Redirección por defecto */}
                <Route 
                    path="*" 
                    element={
                        isAuthenticated ? <DefaultRedirect /> : <Navigate to="/login" replace />
                    } 
                />

            </Routes>
        </div>
    );
}

export default App;