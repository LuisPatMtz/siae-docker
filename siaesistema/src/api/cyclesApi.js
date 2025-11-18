// src/api/cyclesApi.js
import apiClient from './axios';

/**
 * Servicios de gestión de ciclos escolares
 * Endpoints: /ciclos
 */
export const cyclesApi = {
    /**
     * Obtener todos los ciclos escolares
     * @param {boolean} activoSolo - Si true, solo retorna el ciclo activo
     * @returns {Promise<Array>}
     */
    getAll: async (activoSolo = false) => {
        const response = await apiClient.get('/ciclos', {
            params: { activo_solo: activoSolo }
        });
        return response.data;
    },
    
    /**
     * Obtener el ciclo escolar activo
     * @returns {Promise<object>}
     */
    getActivo: async () => {
        const response = await apiClient.get('/ciclos/activo');
        return response.data;
    },
    
    /**
     * Obtener un ciclo por ID
     * @param {number} cicloId 
     * @returns {Promise<object>}
     */
    getById: async (cicloId) => {
        const response = await apiClient.get(`/ciclos/${cicloId}`);
        return response.data;
    },
    
    /**
     * Crear un nuevo ciclo escolar
     * @param {object} cicloData - {nombre, fecha_inicio, fecha_fin, activo}
     * @returns {Promise<object>}
     */
    create: async (cicloData) => {
        const response = await apiClient.post('/ciclos', cicloData);
        return response.data;
    },
    
    /**
     * Actualizar datos de ciclo escolar
     * @param {number} cicloId 
     * @param {object} cicloData - {nombre?, fecha_inicio?, fecha_fin?, activo?}
     * @returns {Promise<object>}
     */
    update: async (cicloId, cicloData) => {
        const response = await apiClient.put(`/ciclos/${cicloId}`, cicloData);
        return response.data;
    },
    
    /**
     * Activar un ciclo escolar (desactiva los demás automáticamente)
     * @param {number} cicloId 
     * @returns {Promise<object>}
     */
    activar: async (cicloId) => {
        const response = await apiClient.post(`/ciclos/${cicloId}/activar`);
        return response.data;
    },
    
    /**
     * Eliminar un ciclo escolar
     * @param {number} cicloId 
     * @returns {Promise<object>}
     */
    delete: async (cicloId) => {
        const response = await apiClient.delete(`/ciclos/${cicloId}`);
        return response.data;
    }
};

export default cyclesApi;
