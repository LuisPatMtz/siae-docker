// src/api/services.js
// Servicios organizados por módulo para consumir todos los endpoints del backend

import apiClient from './axios';

// ============================================
// SERVICIOS DE AUTENTICACIÓN
// ============================================
export const authService = {
    login: async (username, password) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        const response = await apiClient.post('/api/login', formData);
        return response.data;
    },

    getMe: async () => {
        const response = await apiClient.get('/api/users/me');
        return response.data;
    }
};

// ============================================
// SERVICIOS DE USUARIOS
// ============================================
export const usuariosService = {
    getAll: async () => {
        const response = await apiClient.get('/api/users');
        return response.data;
    },

    getById: async (userId) => {
        const response = await apiClient.get(`/api/users/${userId}`);
        return response.data;
    },

    create: async (userData) => {
        const response = await apiClient.post('/api/users', userData);
        return response.data;
    },

    update: async (userId, userData) => {
        const response = await apiClient.put(`/api/users/${userId}`, userData);
        return response.data;
    },

    updatePermissions: async (userId, permissions) => {
        const response = await apiClient.patch(`/api/users/${userId}/permissions`, {
            permissions
        });
        return response.data;
    },

    delete: async (userId) => {
        const response = await apiClient.delete(`/api/users/${userId}`);
        return response.data;
    }
};

// ============================================
// SERVICIOS DE CICLOS ESCOLARES
// ============================================
export const ciclosService = {
    getAll: async (activoSolo = false) => {
        const response = await apiClient.get('/api/ciclos', {
            params: { activo_solo: activoSolo }
        });
        return response.data;
    },

    getActivo: async () => {
        const response = await apiClient.get('/api/ciclos/activo');
        return response.data;
    },

    getById: async (cicloId) => {
        const response = await apiClient.get(`/api/ciclos/${cicloId}`);
        return response.data;
    },

    create: async (cicloData) => {
        const response = await apiClient.post('/api/ciclos', cicloData);
        return response.data;
    },

    update: async (cicloId, cicloData) => {
        const response = await apiClient.put(`/api/ciclos/${cicloId}`, cicloData);
        return response.data;
    },

    activar: async (cicloId) => {
        const response = await apiClient.post(`/api/ciclos/${cicloId}/activar`);
        return response.data;
    },

    delete: async (cicloId) => {
        const response = await apiClient.delete(`/api/ciclos/${cicloId}`);
        return response.data;
    }
};

// ============================================
// SERVICIOS DE GRUPOS
// ============================================
export const gruposService = {
    getAll: async () => {
        const response = await apiClient.get('/api/grupos');
        return response.data;
    },

    getById: async (grupoId) => {
        const response = await apiClient.get(`/api/grupos/${grupoId}`);
        return response.data;
    },

    create: async (grupoData) => {
        const response = await apiClient.post('/api/grupos', grupoData);
        return response.data;
    },

    update: async (grupoId, grupoData) => {
        const response = await apiClient.put(`/api/grupos/${grupoId}`, grupoData);
        return response.data;
    },

    delete: async (grupoId) => {
        const response = await apiClient.delete(`/api/grupos/${grupoId}`);
        return response.data;
    }
};

// ============================================
// SERVICIOS DE ESTUDIANTES
// ============================================
export const estudiantesService = {
    getAll: async () => {
        const response = await apiClient.get('/api/estudiantes');
        return response.data;
    },

    getByMatricula: async (matricula) => {
        const response = await apiClient.get(`/api/estudiantes/${matricula}`);
        return response.data;
    },

    getByGrupo: async (grupoId) => {
        const response = await apiClient.get(`/api/estudiantes/grupo/${grupoId}`);
        return response.data;
    },

    getByCiclo: async (cicloId) => {
        const response = await apiClient.get(`/api/estudiantes/ciclo/${cicloId}`);
        return response.data;
    },

    create: async (estudianteData) => {
        const response = await apiClient.post('/api/estudiantes', estudianteData);
        return response.data;
    },

    update: async (matricula, estudianteData) => {
        const response = await apiClient.put(`/api/estudiantes/${matricula}`, estudianteData);
        return response.data;
    },

    uploadCSV: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/api/estudiantes/upload-csv', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    bulkMoveGroup: async (matriculas, nuevoIdGrupo) => {
        const response = await apiClient.patch('/api/estudiantes/bulk-move-group', {
            matriculas,
            nuevo_id_grupo: nuevoIdGrupo
        });
        return response.data;
    },

    delete: async (matricula) => {
        const response = await apiClient.delete(`/api/estudiantes/${matricula}`);
        return response.data;
    }
};

// ============================================
// SERVICIOS DE TARJETAS NFC
// ============================================
export const nfcService = {
    getAll: async () => {
        const response = await apiClient.get('/api/nfc');
        return response.data;
    },

    getByUID: async (nfcUid) => {
        const response = await apiClient.get(`/api/nfc/${nfcUid}`);
        return response.data;
    },

    getByEstudiante: async (matricula) => {
        const response = await apiClient.get(`/api/nfc/estudiante/${matricula}`);
        return response.data;
    },

    vincular: async (nfcData) => {
        // Endpoint alternativo para vincular NFC
        const response = await apiClient.post('/api/nfc', nfcData);
        return response.data;
    },

    create: async (nfcData) => {
        const response = await apiClient.post('/api/nfc', nfcData);
        return response.data;
    },

    delete: async (nfcUid) => {
        const response = await apiClient.delete(`/api/nfc/${nfcUid}`);
        return response.data;
    },

    deleteByEstudiante: async (matricula) => {
        const response = await apiClient.delete(`/api/nfc/estudiante/${matricula}`);
        return response.data;
    }
};

// ============================================
// SERVICIOS DE ACCESOS
// ============================================
export const accesosService = {
    registrar: async (nfcUid, fechaRegistro = null) => {
        const payload = { nfc_uid: nfcUid };
        if (fechaRegistro) {
            payload.fecha_registro = fechaRegistro;
        }
        const response = await apiClient.post('/api/asistencia/registrar-nfc', payload);
        return response.data;
    },

    getByMatricula: async (matricula) => {
        const response = await apiClient.get(`/api/acceso/${matricula}`);
        return response.data;
    },

    getByCiclo: async (cicloId) => {
        const response = await apiClient.get(`/api/acceso/ciclo/${cicloId}`);
        return response.data;
    },

    // Método auxiliar para verificar si ya existe acceso hoy
    verificarAccesoHoy: async (nfcUid, cicloId) => {
        try {
            const accesos = await apiClient.get(`/api/acceso/ciclo/${cicloId}`);
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

// ============================================
// SERVICIOS DE FALTAS
// ============================================
export const faltasService = {
    getAll: async (filtros = {}) => {
        const response = await apiClient.get('/api/faltas', {
            params: filtros // matricula_estudiante, id_ciclo, fecha, estado
        });
        return response.data;
    },

    getById: async (faltaId) => {
        const response = await apiClient.get(`/api/faltas/${faltaId}`);
        return response.data;
    },

    getByEstudiante: async (matricula, cicloId = null) => {
        const params = cicloId ? { id_ciclo: cicloId } : {};
        const response = await apiClient.get(`/api/faltas/estudiante/${matricula}`, {
            params
        });
        return response.data;
    },

    getByFecha: async (fecha, cicloId = null) => {
        const params = cicloId ? { id_ciclo: cicloId } : {};
        const response = await apiClient.get(`/api/faltas/fecha/${fecha}`, {
            params
        });
        return response.data;
    },

    create: async (faltaData) => {
        const response = await apiClient.post('/api/faltas', faltaData);
        return response.data;
    },

    update: async (faltaId, faltaData) => {
        const response = await apiClient.put(`/api/faltas/${faltaId}`, faltaData);
        return response.data;
    },

    justificar: async (faltaId, justificacion) => {
        const response = await apiClient.patch(`/api/faltas/${faltaId}/justificar`, null, {
            params: { justificacion }
        });
        return response.data;
    },

    delete: async (faltaId) => {
        const response = await apiClient.delete(`/api/faltas/${faltaId}`);
        return response.data;
    }
};

// ============================================
// SERVICIOS DE DASHBOARD
// ============================================
export const dashboardService = {
    getTurnoData: async (modo = 'general') => {
        const response = await apiClient.get('/api/dashboard/turno', {
            params: { modo } // general, matutino, vespertino
        });
        return response.data;
    },

    getGrupoData: async (grupoId, periodo = 'semester') => {
        const response = await apiClient.get(`/api/dashboard/grupo/${grupoId}`, {
            params: { periodo } // week, month, semester
        });
        return response.data;
    },

    getEstadisticasResumen: async () => {
        const response = await apiClient.get('/api/dashboard/estadisticas/resumen');
        return response.data;
    },

    getEstadisticasPeriodos: async (turno = null, grupoId = null) => {
        const params = {};
        if (turno) params.turno = turno;
        if (grupoId) params.grupo_id = grupoId;

        const response = await apiClient.get('/api/dashboard/estadisticas/periodos', { params });
        return response.data;
    }
};

// ============================================
// SERVICIOS DE ASISTENCIA
// ============================================
export const asistenciaService = {
    registrarPorMatricula: async (matricula) => {
        const response = await apiClient.post('/api/asistencia/registrar', null, {
            params: { matricula }
        });
        return response.data;
    },

    getHistorialEstudiante: async (matricula) => {
        const response = await apiClient.get(`/api/asistencia/estudiante/${matricula}`);
        return response.data;
    },

    getAsistenciasHoy: async () => {
        const response = await apiClient.get('/api/asistencia/hoy');
        return response.data;
    },
    getEstadisticasHoy: async () => {
        const response = await apiClient.get('/api/asistencia/estadisticas/hoy');
        return response.data;
    },

    getTodasEntradas: async (fechaInicio = null, fechaFin = null) => {
        const params = {};
        if (fechaInicio) params.fecha_inicio = fechaInicio;
        if (fechaFin) params.fecha_fin = fechaFin;

        const response = await apiClient.get('/api/asistencia/entradas', { params });
        return response.data;
    }
};

// ============================================
// SERVICIOS DE ALERTAS
// ============================================
export const alertasService = {
    // Obtiene estudiantes con faltas injustificadas agrupadas
    getEstudiantesConFaltas: async (modo = 'general', cicloId = null) => {
        try {
            const params = { turno: modo };
            if (cicloId) {
                params.ciclo_id = cicloId;
            }
            
            const response = await apiClient.get('/api/faltas/estudiantes-con-faltas', { params });
            return response.data;
        } catch (error) {
            console.error('Error al obtener estudiantes con faltas:', error);
            throw error;
        }
    },

    // Justifica todas las faltas de un estudiante usando el sistema normalizado
    justificarFaltas: async (faltasIds, textoJustificacion, usuarioRegistro = 'admin') => {
        try {
            // 1. Crear registro de justificación
            const justificacionResponse = await apiClient.post('/api/justificaciones', {
                justificacion: textoJustificacion,
                usuario_registro: usuarioRegistro
            });
            
            const justificacionId = justificacionResponse.data.id;
            
            // 2. Actualizar todas las faltas con el id_justificacion
            const promesas = faltasIds.map(faltaId =>
                apiClient.put(`/api/faltas/${faltaId}`, {
                    estado: 'Justificado',
                    id_justificacion: justificacionId,
                    fecha_justificacion: new Date().toISOString().split('T')[0]
                })
            );
            
            await Promise.all(promesas);
            
            return { 
                success: true, 
                justificacionId,
                faltasActualizadas: faltasIds.length 
            };
        } catch (error) {
            console.error('Error al justificar faltas:', error);
            throw error;
        }
    },

    // Obtiene historial de justificaciones
    getHistorialJustificaciones: async (cicloId = null) => {
        try {
            // Si no se especifica ciclo, obtener el ciclo activo
            if (!cicloId) {
                const cicloActivo = await ciclosService.getActivo();
                cicloId = cicloActivo.id;
            }
            
            // Obtener todas las justificaciones
            const justificacionesResponse = await apiClient.get('/api/justificaciones');
            const justificaciones = Array.isArray(justificacionesResponse.data) ? justificacionesResponse.data : [];
            
            // Obtener estudiantes para mapear nombres
            const estudiantesData = await estudiantesService.getAll();
            const estudiantes = Array.isArray(estudiantesData) ? estudiantesData : [];
            
            // Obtener faltas justificadas SOLO del ciclo activo
            const faltasData = await faltasService.getAll({
                estado: 'Justificado',
                id_ciclo: cicloId
            });
            const faltasResponse = Array.isArray(faltasData) ? faltasData : [];
            
            // Crear historial con una entrada por cada estudiante
            const historial = [];
            
            justificaciones.forEach(just => {
                // Contar faltas de esta justificación
                const faltasDeEstaJust = faltasResponse.filter(f => f.id_justificacion === just.id);
                
                // Agrupar faltas por estudiante
                const faltasPorEstudiante = {};
                faltasDeEstaJust.forEach(falta => {
                    if (!faltasPorEstudiante[falta.matricula_estudiante]) {
                        faltasPorEstudiante[falta.matricula_estudiante] = [];
                    }
                    faltasPorEstudiante[falta.matricula_estudiante].push(falta);
                });
                
                // Crear una entrada en el historial por cada estudiante
                Object.entries(faltasPorEstudiante).forEach(([matricula, faltas]) => {
                    const est = estudiantes.find(e => e.matricula === matricula);
                    const nombreEstudiante = est ? `${est.nombre} ${est.apellido}` : matricula;
                    
                    historial.push({
                        id: just.id,
                        justificacionId: just.id,
                        matriculaEstudiante: matricula,
                        studentName: nombreEstudiante,
                        reason: just.justificacion,
                        justifiedAt: just.fecha_creacion,
                        usuario: just.usuario_registro,
                        faltasCount: faltas.length,
                        estudiantesCount: 1
                    });
                });
            });

            // Ordenar por fecha más reciente
            historial.sort((a, b) => new Date(b.justifiedAt) - new Date(a.justifiedAt));

            return historial;
        } catch (error) {
            console.error('Error al obtener historial:', error);
            throw error;
        }
    }
};

// ============================================
// SERVICIOS DE MANTENIMIENTO
// ============================================
export const maintenanceService = {
    getBackups: async () => {
        const response = await apiClient.get('/api/maintenance/backups');
        return response.data;
    },

    createBackup: async () => {
        const response = await apiClient.post('/api/maintenance/backup');
        return response.data;
    },

    downloadBackup: async (filename) => {
        const response = await apiClient.get(`/api/maintenance/download/${filename}`, {
            responseType: 'blob'
        });
        return response.data;
    },

    deleteBackup: async (filename) => {
        const response = await apiClient.delete(`/api/maintenance/backups/${filename}`);
        return response.data;
    },

    restoreBackup: async (filename) => {
        const response = await apiClient.post(`/api/maintenance/restore/${filename}`);
        return response.data;
    },

    uploadBackup: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/api/maintenance/upload-backup', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    cleanupLogs: async (days = 30) => {
        const response = await apiClient.post(`/api/maintenance/cleanup-logs?days=${days}`);
        return response.data;
    },

    getLogFiles: async () => {
        const response = await apiClient.get('/api/maintenance/log-files');
        return response.data;
    },

    getLogs: async (filters = {}) => {
        const { filename, level, logger_name, limit = 100, search } = filters;
        const params = new URLSearchParams();
        
        if (filename) params.append('filename', filename);
        if (level) params.append('level', level);
        if (logger_name) params.append('logger_name', logger_name);
        if (limit) params.append('limit', limit);
        if (search) params.append('search', search);
        
        const response = await apiClient.get(`/api/maintenance/logs?${params.toString()}`);
        return response.data;
    },

    getDatabaseStats: async () => {
        const response = await apiClient.get('/api/maintenance/database-stats');
        return response.data;
    },

    getTableStats: async () => {
        const response = await apiClient.get('/api/maintenance/table-stats');
        return response.data;
    },

    getTimezoneInfo: async () => {
        const response = await apiClient.get('/api/maintenance/timezone');
        return response.data;
    },

    updateTimezone: async (timezone) => {
        const response = await apiClient.put('/api/maintenance/timezone', { timezone });
        return response.data;
    },

    getAvailableTimezones: async () => {
        const response = await apiClient.get('/api/maintenance/timezones');
        return response.data;
    },

    // System Configuration endpoints
    getAllConfigs: async () => {
        const response = await apiClient.get('/api/system-config/');
        return response.data;
    },

    getConfigByKey: async (key) => {
        const response = await apiClient.get(`/api/system-config/${key}`);
        return response.data;
    },

    updateConfig: async (key, value, description) => {
        const response = await apiClient.put(`/api/system-config/${key}`, {
            value,
            description
        });
        return response.data;
    }
};

// Exportar todos los servicios como un objeto por defecto también
export default {
    auth: authService,
    usuarios: usuariosService,
    ciclos: ciclosService,
    grupos: gruposService,
    estudiantes: estudiantesService,
    nfc: nfcService,
    accesos: accesosService,
    faltas: faltasService,
    dashboard: dashboardService,
    asistencia: asistenciaService,
    alertas: alertasService,
    maintenance: maintenanceService
};
