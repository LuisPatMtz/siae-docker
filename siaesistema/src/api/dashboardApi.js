// src/api/dashboardApi.js
import apiClient from './axios';

/**
 * Servicios de dashboard y estadísticas
 * Endpoints: /dashboard
 */
export const dashboardApi = {
    /**
     * Obtener datos de asistencia por turno
     * @param {string} modo - 'general' | 'matutino' | 'vespertino'
     * @returns {Promise<object>}
     */
    getTurnoData: async (modo = 'general') => {
        const response = await apiClient.get('/api/dashboard/turno', {
            params: { modo }
        });
        return response.data;
    },
    
    /**
     * Obtener datos de asistencia de un grupo específico
     * @param {number} grupoId 
     * @param {string} periodo - 'week' | 'month' | 'semester'
     * @returns {Promise<object>}
     */
    getGrupoData: async (grupoId, periodo = 'semester') => {
        const response = await apiClient.get(`/api/dashboard/grupo/${grupoId}`, {
            params: { periodo }
        });
        return response.data;
    },
    
    /**
     * Obtener estadísticas resumidas del sistema
     * @returns {Promise<{total_estudiantes: number, total_grupos: number, ciclo_activo: string}>}
     */
    getEstadisticasResumen: async () => {
        const response = await apiClient.get('/api/dashboard/estadisticas/resumen');
        return response.data;
    },
    
    /**
     * Obtener estadísticas por períodos (semana, mes, semestre)
     * @param {string} turno - Opcional: 'matutino' | 'vespertino'
     * @param {number} grupoId - Opcional
     * @returns {Promise<{semana: object, mes: object, semestre: object}>}
     */
    getEstadisticasPeriodos: async (turno = null, grupoId = null) => {
        const params = {};
        if (turno) params.turno = turno;
        if (grupoId) params.grupo_id = grupoId;
        
        const response = await apiClient.get('/api/dashboard/estadisticas/periodos', { params });
        return response.data;
    }
};

export default dashboardApi;
