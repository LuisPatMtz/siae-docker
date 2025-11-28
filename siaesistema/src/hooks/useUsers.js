import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axios';
import { useToast } from '../contexts/ToastContext.jsx';

const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { showSuccess, showError } = useToast();

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
            showError('Error al cargar la lista de usuarios');
        } finally {
            setIsLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const createUser = async (newUserData) => {
        try {
            const response = await apiClient.post('/users', newUserData);
            const createdUser = response.data;
            setUsers(currentUsers => [...currentUsers, createdUser]);
            showSuccess(`Usuario "${createdUser.full_name || createdUser.username}" creado exitosamente`);
            return true;
        } catch (error) {
            console.error("Error al crear usuario:", error);
            const apiErrorMessage = error.response?.data?.detail || 'Error al crear el usuario';
            // Note: The original code threw the error to be caught by the modal. 
            // We can either throw it or handle it here. 
            // To keep consistency with other hooks, let's throw it so the UI can react (e.g. keep modal open).
            throw error;
        }
    };

    const updateUser = async (userId, updatedUserData) => {
        try {
            const response = await apiClient.put(`/users/${userId}`, updatedUserData);
            const updatedUser = response.data;
            setUsers(currentUsers =>
                currentUsers.map(user =>
                    user.id === userId ? updatedUser : user
                )
            );
            showSuccess(`Usuario "${updatedUser.full_name || updatedUser.username}" actualizado exitosamente`);
            return true;
        } catch (error) {
            console.error("Error al actualizar usuario:", error);
            const apiErrorMessage = error.response?.data?.detail || 'Error al actualizar el usuario';
            showError(apiErrorMessage);
            throw error;
        }
    };

    const deleteUser = async (userId, userName) => {
        try {
            await apiClient.delete(`/users/${userId}`);
            setUsers(currentUsers => currentUsers.filter(user => user.id !== userId));
            showSuccess(`Usuario "${userName}" eliminado correctamente`);
            return true;
        } catch (error) {
            console.error(`Error al eliminar usuario ${userId}:`, error);
            const apiErrorMessage = error.response?.data?.detail || 'Error al eliminar el usuario.';
            showError(apiErrorMessage);
            throw error;
        }
    };

    const updatePermission = async (userId, permissionKey, newValue) => {
        // Optimistic UI
        const originalUsers = [...users];
        const targetUser = originalUsers.find(u => u.id === userId);
        if (!targetUser) return;

        // Mapeo de nombres de permisos para mensajes más amigables
        const permissionLabels = {
            canViewDashboard: 'Ver Dashboard',
            canManageAlerts: 'Gestionar Alertas',
            canEditStudents: 'Editar Estudiantes',
            canManageUsers: 'Gestionar Usuarios',
            canManageMaintenance: 'Mantenimiento',
            canManageAttendance: 'Gestión de Asistencia'
        };

        setUsers(currentUsers => currentUsers.map(user => {
            if (user.id === userId) {
                return {
                    ...user,
                    permissions: { ...user.permissions, [permissionKey]: newValue }
                };
            }
            return user;
        }));

        try {
            const updatedPermissions = {
                ...targetUser.permissions,
                [permissionKey]: newValue
            };
            await apiClient.patch(`/users/${userId}/permissions`, {
                permissions: updatedPermissions
            });
            
            // Mensaje personalizado según el permiso y el estado
            const permissionLabel = permissionLabels[permissionKey] || permissionKey;
            const userName = targetUser.full_name || targetUser.username;
            
            if (newValue) {
                // Mensaje cuando se ACTIVA un permiso
                showSuccess(`✓ Permiso "${permissionLabel}" activado para ${userName}`);
            } else {
                // Mensaje cuando se DESACTIVA un permiso
                showSuccess(`Permiso "${permissionLabel}" desactivado para ${userName}`);
            }
        } catch (error) {
            console.error("Error al actualizar permiso:", error);
            showError('Error al guardar el permiso. Cambios revertidos.');
            setUsers(originalUsers); // Rollback
        }
    };

    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (user.full_name && user.full_name.toLowerCase().includes(searchLower)) ||
            (user.username && user.username.toLowerCase().includes(searchLower)) ||
            (user.role && user.role.toLowerCase().includes(searchLower))
        );
    });

    return {
        users,
        isLoading,
        searchTerm,
        setSearchTerm,
        filteredUsers,
        createUser,
        updateUser,
        deleteUser,
        updatePermission,
        fetchUsers
    };
};

export default useUsers;
