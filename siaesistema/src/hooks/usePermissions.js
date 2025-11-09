// src/hooks/usePermissions.js
import { useAuth } from '../components/Auth/AuthContext';

export const usePermissions = () => {
    const { hasPermission } = useAuth();

    return {
        // Permisos específicos del sistema
        canViewDashboard: hasPermission('canViewDashboard'),
        canManageAlerts: hasPermission('canManageAlerts'),
        canEditStudents: hasPermission('canEditStudents'),
        canManageUsers: hasPermission('canManageUsers'),
        
        // Función general para verificar cualquier permiso
        hasPermission,
        
        // Funciones de conveniencia para combinaciones de permisos
        canAccessAnySection: () => {
            return hasPermission('canViewDashboard') || 
                   hasPermission('canManageAlerts') || 
                   hasPermission('canEditStudents') || 
                   hasPermission('canManageUsers');
        },
        
        isAdmin: () => {
            return hasPermission('canManageUsers');
        },
        
        canManageData: () => {
            return hasPermission('canEditStudents') || hasPermission('canManageAlerts');
        }
    };
};

export default usePermissions;