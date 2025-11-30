/**
 * API de Ciclos Escolares
 * Gestión de periodos académicos
 */
import apiClient from './axios';

export const ciclosService = {
    /**
     * Obtiene todos los ciclos escolares
     * @param {boolean} activoSolo - Si true, solo retorna ciclos activos
     * @returns {Promise<Array>} Lista de ciclos
     */
    getAll: async (activoSolo = false) => {
        const response = await apiClient.get('/api/ciclos', {
            params: { activo_solo: activoSolo }
        });
        return response.data;
    },
    
    /**
     * Obtiene el ciclo escolar activo
     * @returns {Promise<Object>} Ciclo activo
     */
    getActivo: async () => {
        const response = await apiClient.get('/api/ciclos/activo');
        return response.data;
    },
    
    /**
     * Obtiene un ciclo por ID
     * @param {number} cicloId - ID del ciclo
     * @returns {Promise<Object>} Datos del ciclo
     */
    getById: async (cicloId) => {
        const response = await apiClient.get(`/api/ciclos/${cicloId}`);
        return response.data;
    },
    
    /**
     * Crea un nuevo ciclo escolar
     * @param {Object} cicloData - Datos del ciclo (nombre, fecha_inicio, fecha_fin, activo)
     * @returns {Promise<Object>} Ciclo creado
     */
    create: async (cicloData) => {
        const response = await apiClient.post('/api/ciclos', cicloData);
        return response.data;
    },
    
    /**
     * Actualiza un ciclo existente
     * @param {number} cicloId - ID del ciclo
     * @param {Object} cicloData - Datos a actualizar
     * @returns {Promise<Object>} Ciclo actualizado
     */
    update: async (cicloId, cicloData) => {
        const response = await apiClient.put(`/api/ciclos/${cicloId}`, cicloData);
        return response.data;
    },
    
    /**
     * Activa un ciclo (desactiva los demás automáticamente)
     * @param {number} cicloId - ID del ciclo a activar
     * @returns {Promise<Object>} Ciclo activado
     */
    activar: async (cicloId) => {
        const response = await apiClient.post(`/api/ciclos/${cicloId}/activar`);
        return response.data;
    },
    
    /**
     * Elimina un ciclo escolar (CASCADE en accesos y faltas)
     * @param {number} cicloId - ID del ciclo a eliminar
     * @returns {Promise<void>}
     */
    delete: async (cicloId) => {
        const response = await apiClient.delete(`/api/ciclos/${cicloId}`);
        return response.data;
    }
};

export default ciclosService;
