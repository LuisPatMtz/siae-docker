// src/api/accessApi.js
import apiClient from './axios';

/**
 * Servicios de registro de accesos (NFC + Accesos)
 * Endpoints: /nfc, /acceso
 */
export const accessApi = {
    // ===== TARJETAS NFC =====

    /**
     * Obtener todas las tarjetas NFC vinculadas
     * @returns {Promise<Array>}
     */
    getAllNFC: async () => {
        const response = await apiClient.get('/nfc');
        return response.data;
    },

    /**
     * Obtener tarjeta NFC por UID
     * @param {string} nfcUid 
     * @returns {Promise<object>}
     */
    getNFCByUID: async (nfcUid) => {
        const response = await apiClient.get(`/nfc/${nfcUid}`);
        return response.data;
    },

    /**
     * Obtener tarjeta NFC vinculada a un estudiante
     * @param {string} matricula 
     * @returns {Promise<object>}
     */
    getNFCByEstudiante: async (matricula) => {
        const response = await apiClient.get(`/nfc/estudiante/${matricula}`);
        return response.data;
    },

    /**
     * Vincular tarjeta NFC a estudiante
     * @param {object} nfcData - {nfc_uid, matricula_estudiante}
     * @returns {Promise<object>}
     */
    vincularNFC: async (nfcData) => {
        const response = await apiClient.post('/nfc', nfcData);
        return response.data;
    },

    /**
     * Crear tarjeta NFC (alternativo a vincular)
     * @param {object} nfcData - {nfc_uid, matricula_estudiante}
     * @returns {Promise<object>}
     */
    createNFC: async (nfcData) => {
        const response = await apiClient.post('/nfc', nfcData);
        return response.data;
    },

    /**
     * Eliminar vinculación NFC por UID
     * @param {string} nfcUid 
     * @returns {Promise<object>}
     */
    deleteNFC: async (nfcUid) => {
        const response = await apiClient.delete(`/nfc/${nfcUid}`);
        return response.data;
    },

    /**
     * Eliminar vinculación NFC de estudiante
     * @param {string} matricula 
     * @returns {Promise<object>}
     */
    deleteNFCByEstudiante: async (matricula) => {
        const response = await apiClient.delete(`/nfc/estudiante/${matricula}`);
        return response.data;
    },

    // ===== REGISTROS DE ACCESO =====

    /**
     * Registrar acceso con tarjeta NFC
     * @param {string} nfcUid 
     * @param {string} fechaRegistro - Opcional, formato YYYY-MM-DD (para testing)
     * @returns {Promise<object>}
     */
    registrarAcceso: async (nfcUid, fechaRegistro = null) => {
        const payload = { nfc_uid: nfcUid };
        if (fechaRegistro) {
            payload.fecha_registro = fechaRegistro;
        }
        const response = await apiClient.post('/asistencia/registrar-nfc', payload);
        return response.data;
    },

    /**
     * Obtener accesos de un estudiante por matrícula
     * @param {string} matricula 
     * @returns {Promise<Array>}
     */
    getAccesosByMatricula: async (matricula) => {
        const response = await apiClient.get(`/acceso/${matricula}`);
        return response.data;
    },

    /**
     * Obtener accesos de un ciclo escolar
     * @param {number} cicloId 
     * @returns {Promise<Array>}
     */
    getAccesosByCiclo: async (cicloId) => {
        const response = await apiClient.get(`/acceso/ciclo/${cicloId}`);
        return response.data;
    },

    /**
     * Verificar si ya existe acceso hoy para un estudiante
     * @param {string} nfcUid 
     * @param {number} cicloId 
     * @returns {Promise<object|null>}
     */
    verificarAccesoHoy: async (nfcUid, cicloId) => {
        try {
            const accesos = await apiClient.get(`/acceso/ciclo/${cicloId}`);
            const hoy = new Date().toISOString().split('T')[0];

            return accesos.data.find(acceso => {
                const fechaAcceso = new Date(acceso.hora_registro).toISOString().split('T')[0];
                return acceso.nfc_uid === nfcUid && fechaAcceso === hoy;
            });
        } catch (error) {
            return null;
        }
    }
};

export default accessApi;
