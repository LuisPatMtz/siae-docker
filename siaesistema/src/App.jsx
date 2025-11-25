// src/App.jsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Importamos componentes de Layout y Auth
import MainLayout from './components/Layout/MainLayout.jsx';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import PermissionRoute from './components/Auth/PermissionRoute.jsx';
import { useAuth } from './components/Auth/AuthContext.jsx';

// Importamos las Páginas dinámicamente
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const LoadingPage = lazy(() => import('./pages/LoadingPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));

const AlertasPage = lazy(() => import('./pages/AlertasPage.jsx'));
const GestionUsuariosPage = lazy(() => import('./pages/GestionUsuariosPage.jsx'));
const GestionEstudiantesPage = lazy(() => import('./pages/GestionEstudiantesPage.jsx'));
const RegistroAccesoPage = lazy(() => import('./pages/RegistroAccesoPage.jsx'));
const HistorialAsistenciasPage = lazy(() => import('./pages/HistorialAsistenciasPage.jsx'));
const CorteFaltasPage = lazy(() => import('./pages/CorteFaltasPage.jsx'));

function App() {
    return (
        <Suspense fallback={<LoadingPage />}>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedRoute />}>
                    <Route element={<MainLayout />}>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/alertas" element={<AlertasPage />} />
                        <Route path="/gestion-usuarios" element={<GestionUsuariosPage />} />
                        <Route path="/gestion-estudiantes" element={<GestionEstudiantesPage />} />
                        <Route path="/registro-acceso" element={<RegistroAccesoPage />} />
                        <Route path="/historial-asistencias" element={<HistorialAsistenciasPage />} />
                        <Route path="/corte-faltas" element={<CorteFaltasPage />} />
                    </Route>
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Suspense>
    );
}

export default App;