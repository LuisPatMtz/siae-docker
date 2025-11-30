import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axios';
import { useToast } from '../contexts/ToastContext.jsx';

const useGroups = (isGroupManagementVisible) => {
    const [grupos, setGrupos] = useState([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const { showSuccess, showError } = useToast();

    const fetchGroups = useCallback(async () => {
        if (!isGroupManagementVisible) return;

        setIsLoadingGroups(true);
        try {
            const response = await apiClient.get('/api/grupos');
            setGrupos(response.data);

            // Stats logic (optional to keep here or move to UI, keeping here for now as per original)
            if (response.data.length > 0) {
                const gruposConNombre = response.data.filter(g => g.nombre && g.nombre.trim() !== '').length;
                const gruposSinNombre = response.data.length - gruposConNombre;

                const semestreStats = response.data.reduce((acc, grupo) => {
                    acc[grupo.semestre] = (acc[grupo.semestre] || 0) + 1;
                    return acc;
                }, {});

                const semestresInfo = Object.entries(semestreStats)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([sem, count]) => `${count} grupo(s) de ${sem}° semestre`)
                    .join(', ');

                let mensaje = `Se encontraron ${response.data.length} grupo(s): ${semestresInfo}.`;
                if (gruposSinNombre > 0) {
                    mensaje += ` ⚠️ ${gruposSinNombre} grupo(s) sin nombre.`;
                }

                // Only show success if it's the initial load or explicit refresh, 
                // but the original code showed it on every effect run when visible.
                // To avoid spamming toasts if this hook re-runs, we might want to be careful,
                // but following original logic for now.
                showSuccess(mensaje);
            } else {
                showSuccess('No se encontraron grupos. ¡Crea tu primer grupo!');
            }
        } catch (error) {
            console.error("Error al obtener grupos:", error);
            let errorMsg = 'Error al cargar grupos.';
            if (error.response) {
                const status = error.response.status;
                const detail = error.response.data?.detail;
                if (status === 401) errorMsg = 'No tienes permisos para ver los grupos.';
                else if (status === 403) errorMsg = 'Acceso denegado para consultar grupos.';
                else if (status === 404) errorMsg = 'El servicio de grupos no está disponible.';
                else errorMsg = detail || `Error del servidor (${status}).`;
            } else if (error.request) {
                errorMsg = 'Error de conexión. Verifica tu conexión a internet.';
            }
            showError(errorMsg);
            setGrupos([]);
        } finally {
            setIsLoadingGroups(false);
        }
    }, [isGroupManagementVisible, showSuccess, showError]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const createGroup = async (groupData) => {
        try {
            const response = await apiClient.post('/api/grupos', groupData);
            const newGroup = response.data;
            showSuccess(`¡Grupo "${newGroup.nombre}" creado exitosamente!`);
            setGrupos(prevGroups => [...prevGroups, newGroup]);
            return true;
        } catch (error) {
            console.error("Error al crear grupo:", error);
            let errorMsg = 'Error desconocido al crear grupo.';
            if (error.response) {
                const status = error.response.status;
                const detail = error.response.data?.detail;
                if (status === 409) errorMsg = detail || `El grupo "${groupData.nombre}" ya existe.`;
                else if (status === 400) errorMsg = detail || 'Los datos del grupo son inválidos.';
                else if (status === 401) errorMsg = 'No tienes permisos para crear grupos.';
                else if (status === 403) errorMsg = 'Acceso denegado para crear grupos.';
                else errorMsg = detail || `Error del servidor (${status}).`;
            } else if (error.request) {
                errorMsg = 'Error de conexión. Verifica tu conexión a internet.';
            }
            throw new Error(errorMsg);
        }
    };

    const updateGroup = async (id, groupData) => {
        try {
            const response = await apiClient.put(`/api/grupos/${id}`, groupData);
            const updatedGroup = response.data;
            showSuccess(`¡Grupo "${updatedGroup.nombre}" actualizado exitosamente!`);
            setGrupos(prevGroups =>
                prevGroups.map(grupo =>
                    grupo.id === id ? updatedGroup : grupo
                )
            );
            return true;
        } catch (error) {
            console.error("Error al actualizar grupo:", error);
            let errorMsg = 'Error desconocido al actualizar grupo.';
            if (error.response) {
                const status = error.response.status;
                const detail = error.response.data?.detail;
                if (status === 404) errorMsg = 'El grupo no fue encontrado.';
                else if (status === 409) errorMsg = detail || `El nombre "${groupData.nombre}" ya está en uso.`;
                else if (status === 400) errorMsg = detail || 'Los datos del grupo son inválidos.';
                else if (status === 401) errorMsg = 'No tienes permisos para actualizar grupos.';
                else if (status === 403) errorMsg = 'Acceso denegado para actualizar grupos.';
                else errorMsg = detail || `Error del servidor (${status}).`;
            } else if (error.request) {
                errorMsg = 'Error de conexión. Verifica tu conexión a internet.';
            }
            throw new Error(errorMsg);
        }
    };

    const deleteGroup = async (id, groupName) => {
        try {
            await apiClient.delete(`/api/grupos/${id}`);
            showSuccess(`¡Grupo "${groupName || `ID: ${id}`}" eliminado exitosamente!`);
            setGrupos(prevGroups =>
                prevGroups.filter(grupo => grupo.id !== id)
            );
            return true;
        } catch (error) {
            console.error("Error al eliminar grupo:", error);
            let errorMsg = 'Error desconocido al eliminar grupo.';
            if (error.response) {
                const status = error.response.status;
                const detail = error.response.data?.detail;
                if (status === 404) errorMsg = 'El grupo no fue encontrado o ya fue eliminado.';
                else if (status === 400) errorMsg = detail || 'No se puede eliminar el grupo. Puede tener estudiantes asignados.';
                else if (status === 401) errorMsg = 'No tienes permisos para eliminar grupos.';
                else if (status === 403) errorMsg = 'Acceso denegado para eliminar grupos.';
                else errorMsg = detail || `Error del servidor (${status}).`;
            } else if (error.request) {
                errorMsg = 'Error de conexión. Verifica tu conexión a internet.';
            }
            showError(errorMsg);
            return false;
        }
    };

    return {
        grupos,
        isLoadingGroups,
        createGroup,
        updateGroup,
        deleteGroup,
        fetchGroups
    };
};

export default useGroups;
