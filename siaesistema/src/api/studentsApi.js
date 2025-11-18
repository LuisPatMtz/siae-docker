// src/api/studentsApi.js
import apiClient from './axios';

/**
 * Servicios de gestión de estudiantes
 * Endpoints: /estudiantes
 */
export const studentsApi = {
    /**
     * Obtener todos los estudiantes
     * @returns {Promise<Array>}
     */
    getAll: async () => {
        const response = await apiClient.get('/estudiantes');
        return response.data;
    },
    
    /**
     * Obtener un estudiante por matrícula
     * @param {string} matricula 
     * @returns {Promise<object>}
     */
    getByMatricula: async (matricula) => {
        const response = await apiClient.get(`/estudiantes/${matricula}`);
        return response.data;
    },
    
    /**
     * Obtener estudiantes de un grupo
     * @param {number} grupoId 
     * @returns {Promise<Array>}
     */
    getByGrupo: async (grupoId) => {
        const response = await apiClient.get(`/estudiantes/grupo/${grupoId}`);
        return response.data;
    },
    
    /**
     * Obtener estudiantes de un ciclo escolar
     * @param {number} cicloId 
     * @returns {Promise<Array>}
     */
    getByCiclo: async (cicloId) => {
        const response = await apiClient.get(`/estudiantes/ciclo/${cicloId}`);
        return response.data;
    },
    
    /**
     * Crear un nuevo estudiante
     * @param {object} estudianteData - {matricula, nombre, apellido_paterno, apellido_materno, id_grupo, id_ciclo}
     * @returns {Promise<object>}
     */
    create: async (estudianteData) => {
        const response = await apiClient.post('/estudiantes', estudianteData);
        return response.data;
    },
    
    /**
     * Actualizar datos de estudiante
     * @param {string} matricula 
     * @param {object} estudianteData 
     * @returns {Promise<object>}
     */
    update: async (matricula, estudianteData) => {
        const response = await apiClient.put(`/estudiantes/${matricula}`, estudianteData);
        return response.data;
    },
    
    /**
     * Carga masiva de estudiantes por CSV
     * @param {File} file - Archivo CSV
     * @returns {Promise<{creados: number, actualizados: number, errores: Array}>}
     */
    uploadCSV: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/estudiantes/upload-csv', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },
    
    /**
     * Mover estudiantes a un nuevo grupo de forma masiva
     * @param {Array<string>} matriculas 
     * @param {number} nuevoIdGrupo 
     * @returns {Promise<{actualizados: number}>}
     */
    bulkMoveGroup: async (matriculas, nuevoIdGrupo) => {
        const response = await apiClient.patch('/estudiantes/bulk-move-group', {
            matriculas,
            nuevo_id_grupo: nuevoIdGrupo
        });
        return response.data;
    },
    
    /**
     * Eliminar un estudiante
     * @param {string} matricula 
     * @returns {Promise<object>}
     */
    delete: async (matricula) => {
        const response = await apiClient.delete(`/estudiantes/${matricula}`);
        return response.data;
    }
};

export default studentsApi;
