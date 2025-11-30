import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axios';
import { useToast } from '../contexts/ToastContext.jsx';

const useCycles = (isSchoolCycleVisible) => {
    const [ciclosEscolares, setCiclosEscolares] = useState([]);
    const [isLoadingCycles, setIsLoadingCycles] = useState(false);
    const { showSuccess, showError } = useToast();

    const fetchCycles = useCallback(async () => {
        try {
            setIsLoadingCycles(true);
            const response = await apiClient.get('/api/ciclos');
            setCiclosEscolares(response.data);
        } catch (error) {
            console.error('Error loading ciclos escolares:', error);
            showError('Error al cargar los ciclos escolares');
        } finally {
            setIsLoadingCycles(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchCycles();
    }, [fetchCycles]);

    const createCycle = async (cycleData) => {
        try {
            const response = await apiClient.post('/api/ciclos', cycleData);
            setCiclosEscolares(prev => [...prev, response.data]);
            showSuccess('Ciclo escolar creado correctamente');
            return true;
        } catch (error) {
            console.error('Error creating ciclo escolar:', error);
            showError(error.response?.data?.detail || 'Error al crear el ciclo escolar');
            return false;
        }
    };

    const updateCycle = async (id, cycleData) => {
        try {
            const response = await apiClient.put(`/api/ciclos/${id}`, cycleData);
            setCiclosEscolares(prev => prev.map(cycle =>
                cycle.id === id ? response.data : cycle
            ));
            showSuccess('Ciclo escolar actualizado correctamente');
            return true;
        } catch (error) {
            console.error('Error updating ciclo escolar:', error);
            showError(error.response?.data?.detail || 'Error al actualizar el ciclo escolar');
            return false;
        }
    };

    const deleteCycle = async (id) => {
        try {
            await apiClient.delete(`/api/ciclos/${id}`);
            setCiclosEscolares(prev => prev.filter(cycle => cycle.id !== id));
            showSuccess('Ciclo escolar eliminado correctamente');
            return true;
        } catch (error) {
            console.error('Error deleting ciclo escolar:', error);
            showError(error.response?.data?.detail || 'Error al eliminar el ciclo escolar');
            return false;
        }
    };

    const toggleCycleStatus = async (id) => {
        try {
            const response = await apiClient.post(`/api/ciclos/${id}/activar`);
            const updatedCycle = response.data;

            setCiclosEscolares(prev => prev.map(c =>
                c.id === id ? updatedCycle : (updatedCycle.activo ? { ...c, activo: false } : c)
            ));

            showSuccess(`Ciclo escolar ${updatedCycle.activo ? 'activado' : 'desactivado'} correctamente`);
            return true;
        } catch (error) {
            console.error('Error toggling ciclo status:', error);
            showError(error.response?.data?.detail || 'Error al cambiar estado del ciclo');
            return false;
        }
    };

    return {
        ciclosEscolares,
        isLoadingCycles,
        createCycle,
        updateCycle,
        deleteCycle,
        toggleCycleStatus,
        fetchCycles
    };
};

export default useCycles;
