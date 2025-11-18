// src/api/faultsApi.js
import apiClient from './axios';

/**
 * Servicios de gestión de faltas
 * Endpoints: /faltas
 */
export const faultsApi = {
    /**
     * Obtener todas las faltas con filtros opcionales
     * @param {object} filtros - {matricula_estudiante?, id_ciclo?, fecha?, estado?}
     * @returns {Promise<Array>}
     */
    getAll: async (filtros = {}) => {
        const response = await apiClient.get('/faltas', {
            params: filtros
        });
        return response.data;
    },
    
    /**
     * Obtener una falta por ID
     * @param {number} faltaId 
     * @returns {Promise<object>}
     */
    getById: async (faltaId) => {
        const response = await apiClient.get(`/faltas/${faltaId}`);
        return response.data;
    },
    
    /**
     * Obtener faltas de un estudiante
     * @param {string} matricula 
     * @param {number} cicloId - Opcional
     * @returns {Promise<Array>}
     */
    getByEstudiante: async (matricula, cicloId = null) => {
        const params = cicloId ? { id_ciclo: cicloId } : {};
        const response = await apiClient.get(`/faltas/estudiante/${matricula}`, {
            params
        });
        return response.data;
    },
    
    /**
     * Obtener faltas de una fecha específica
     * @param {string} fecha - Formato YYYY-MM-DD
     * @param {number} cicloId - Opcional
     * @returns {Promise<Array>}
     */
    getByFecha: async (fecha, cicloId = null) => {
        const params = cicloId ? { id_ciclo: cicloId } : {};
        const response = await apiClient.get(`/faltas/fecha/${fecha}`, {
            params
        });
        return response.data;
    },
    
    /**
     * Registrar una nueva falta
     * @param {object} faltaData - {matricula_estudiante, fecha_falta, id_ciclo, observaciones?}
     * @returns {Promise<object>}
     */
    create: async (faltaData) => {
        const response = await apiClient.post('/faltas', faltaData);
        return response.data;
    },
    
    /**
     * Actualizar datos de falta
     * @param {number} faltaId 
     * @param {object} faltaData - {fecha_falta?, observaciones?, estado?}
     * @returns {Promise<object>}
     */
    update: async (faltaId, faltaData) => {
        const response = await apiClient.put(`/faltas/${faltaId}`, faltaData);
        return response.data;
    },
    
    /**
     * Justificar una falta
     * @param {number} faltaId 
     * @param {string} justificacion 
     * @returns {Promise<object>}
     */
    justificar: async (faltaId, justificacion) => {
        const response = await apiClient.patch(`/faltas/${faltaId}/justificar`, null, {
            params: { justificacion }
        });
        return response.data;
    },
    
    /**
     * Eliminar una falta
     * @param {number} faltaId 
     * @returns {Promise<object>}
     */
    delete: async (faltaId) => {
        const response = await apiClient.delete(`/faltas/${faltaId}`);
        return response.data;
    }
};

export default faultsApi;
