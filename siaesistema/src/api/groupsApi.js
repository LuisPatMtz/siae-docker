// src/api/groupsApi.js
import apiClient from './axios';

/**
 * Servicios de gestión de grupos
 * Endpoints: /grupos
 */
export const groupsApi = {
    /**
     * Obtener todos los grupos
     * @returns {Promise<Array>}
     */
    getAll: async () => {
        const response = await apiClient.get('/grupos');
        return response.data;
    },
    
    /**
     * Obtener un grupo por ID
     * @param {number} grupoId 
     * @returns {Promise<object>}
     */
    getById: async (grupoId) => {
        const response = await apiClient.get(`/grupos/${grupoId}`);
        return response.data;
    },
    
    /**
     * Crear un nuevo grupo
     * @param {object} grupoData - {nombre, semestre, turno}
     * @returns {Promise<object>}
     */
    create: async (grupoData) => {
        const response = await apiClient.post('/grupos', grupoData);
        return response.data;
    },
    
    /**
     * Actualizar datos de grupo
     * @param {number} grupoId 
     * @param {object} grupoData - {nombre?, semestre?, turno?}
     * @returns {Promise<object>}
     */
    update: async (grupoId, grupoData) => {
        const response = await apiClient.put(`/grupos/${grupoId}`, grupoData);
        return response.data;
    },
    
    /**
     * Eliminar un grupo
     * @param {number} grupoId 
     * @returns {Promise<object>}
     */
    delete: async (grupoId) => {
        const response = await apiClient.delete(`/grupos/${grupoId}`);
        return response.data;
    }
};

export default groupsApi;
