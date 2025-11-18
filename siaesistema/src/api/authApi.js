/**
 * API de Autenticación
 * Maneja login y obtención de usuario actual
 */
import apiClient from './axios';

export const authService = {
    /**
     * Login de usuario
     * @param {string} username - Nombre de usuario
     * @param {string} password - Contraseña
     * @returns {Promise<{access_token: string, token_type: string}>}
     */
    login: async (username, password) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        const response = await apiClient.post('/login', formData);
        return response.data;
    },
    
    /**
     * Obtiene información del usuario actual
     * @returns {Promise<Object>} Usuario autenticado
     */
    getMe: async () => {
        const response = await apiClient.get('/users/me');
        return response.data;
    }
};

export default authService;
