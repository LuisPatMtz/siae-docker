/**
 * Índice centralizado de APIs
 * Exporta todos los servicios modularizados
 * Naming: 1:1 con endpoints backend
 */

// Exportar servicios individuales
export { default as authApi } from './authApi';
export { default as usersApi } from './usersApi';
export { default as studentsApi } from './studentsApi';
export { default as groupsApi } from './groupsApi';
export { default as cyclesApi } from './cyclesApi';
export { default as accessApi } from './accessApi';
export { default as faultsApi } from './faultsApi';
export { default as dashboardApi } from './dashboardApi';

// Exportar como objeto para compatibilidad con services.js antiguo
export default {
    auth: authApi,
    users: usersApi,
    students: studentsApi,
    groups: groupsApi,
    cycles: cyclesApi,
    access: accessApi,
    faults: faultsApi,
    dashboard: dashboardApi
};
