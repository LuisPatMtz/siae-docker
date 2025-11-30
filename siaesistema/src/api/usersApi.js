/**
 * API de Usuarios
 * CRUD completo de usuarios y gestión de permisos
 */
import apiClient from './axios';

export const usersService = {
    /**
     * Obtiene todos los usuarios
     * @returns {Promise<Array>} Lista de usuarios
     */
    getAll: async () => {
        const response = await apiClient.get('/api/users');
        return response.data;
    },
    
    /**
     * Obtiene un usuario por ID
     * @param {number} userId - ID del usuario
     * @returns {Promise<Object>} Datos del usuario
     */
    getById: async (userId) => {
        const response = await apiClient.get(`/api/users/${userId}`);
        return response.data;
    },
    
    /**
     * Crea un nuevo usuario
     * @param {Object} userData - Datos del usuario (username, password, role, permissions)
     * @returns {Promise<Object>} Usuario creado
     */
    create: async (userData) => {
        const response = await apiClient.post('/api/users', userData);
        return response.data;
    },
    
    /**
     * Actualiza un usuario existente
     * @param {number} userId - ID del usuario
     * @param {Object} userData - Datos a actualizar
     * @returns {Promise<Object>} Usuario actualizado
     */
    update: async (userId, userData) => {
        const response = await apiClient.put(`/api/users/${userId}`, userData);
        return response.data;
    },
    
    /**
     * Actualiza solo los permisos de un usuario
     * @param {number} userId - ID del usuario
     * @param {Object} permissions - Objeto con permisos
     * @returns {Promise<Object>} Usuario actualizado
     */
    updatePermissions: async (userId, permissions) => {
        const response = await apiClient.patch(`/api/users/${userId}/permissions`, {
            permissions
        });
        return response.data;
    },
    
    /**
     * Elimina un usuario
     * @param {number} userId - ID del usuario a eliminar
     * @returns {Promise<void>}
     */
    delete: async (userId) => {
        const response = await apiClient.delete(`/api/users/${userId}`);
        return response.data;
    }
};

export default usersService;
