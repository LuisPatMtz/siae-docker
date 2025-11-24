// src/pages/AlertasPage.jsx
import React, { useState, useEffect } from 'react';
import { Search, History, AlertTriangle, CheckCircle } from 'lucide-react';
import { alertasService } from '../api/services';
import DashboardControls from '../components/Dashboard/DashboardControls.jsx';
import AlertsTable from '../components/Alerts/AlertsTable.jsx';
import JustifyModal from '../components/Alerts/JustifyModal.jsx';
import JustificationHistoryModal from '../components/Alerts/JustificationHistoryModal.jsx';
import '../styles/alertas.css';

const AlertasPage = () => {
    const [activeMode, setActiveMode] = useState('general');
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [allAlertsList, setAllAlertsList] = useState([]);
    const [filteredAlertsList, setFilteredAlertsList] = useState([]);
    const [expandedHistoryId, setExpandedHistoryId] = useState(null);
    const [modalState, setModalState] = useState({ isOpen: false, studentId: null, studentName: '', faltasIds: [] });
    const [justificationHistory, setJustificationHistory] = useState([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // Cargar datos del backend según el turno
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                console.log(`Cargando alertas para: ${activeMode}`);

                // Obtener alertas del backend
                const alertas = await alertasService.getEstudiantesConFaltas(activeMode);

                // Obtener historial de justificaciones
                const historial = await alertasService.getHistorialJustificaciones();

                setAllAlertsList(alertas);
                setFilteredAlertsList(alertas);
                setJustificationHistory(historial);
                setSearchQuery('');
                setExpandedHistoryId(null);
                setModalState({ isOpen: false, studentId: null, studentName: '', faltasIds: [] });
                setIsHistoryModalOpen(false);

            } catch (error) {
                console.error("Error al obtener alertas:", error);
                // En caso de error, mostrar lista vacía
                setAllAlertsList([]);
                setFilteredAlertsList([]);
                setJustificationHistory([]);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(() => fetchData(), 300);
        return () => clearTimeout(timer);
    }, [activeMode]);

    // Filtrar localmente por búsqueda
    useEffect(() => {
        const filtered = allAlertsList.filter(alert =>
            alert.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            alert.matricula.includes(searchQuery)
        );
        setFilteredAlertsList(filtered);
    }, [searchQuery, allAlertsList]);

    // Funciones para modales y historial
    const toggleHistory = (studentId) => {
        setExpandedHistoryId(prevId => (prevId === studentId ? null : studentId));
    };

    const openJustifyModal = (studentId, studentName) => {
        const alert = allAlertsList.find(a => a.id === studentId);
        setModalState({
            isOpen: true,
            studentId,
            studentName,
            faltasIds: alert?.faltasIds || []
        });
    };

    const closeJustifyModal = () => {
        setModalState({ isOpen: false, studentId: null, studentName: '', faltasIds: [] });
    };

    const openHistoryModal = () => setIsHistoryModalOpen(true);
    const closeHistoryModal = () => setIsHistoryModalOpen(false);

    // Enviar justificación al backend
    const submitJustification = async (reason) => {
        const { studentId, faltasIds } = modalState;
        const studentName = allAlertsList.find(alert => alert.id === studentId)?.nombre || 'Desconocido';

        try {
            console.log(`Justificando ${faltasIds.length} faltas de ${studentName} con motivo: "${reason}"`);

            // Llamar al backend para justificar
            await alertasService.justificarFaltas(faltasIds, reason);

            // Actualizar historial local
            const newHistoryEntry = {
                id: `hist-${Date.now()}`,
                studentId: studentId,
                studentName: studentName,
                reason: reason,
                justifiedAt: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
            };
            setJustificationHistory(prevHistory => [newHistoryEntry, ...prevHistory]);

            // Eliminar al alumno de las listas activas
            setAllAlertsList(prevList => prevList.filter(alert => alert.id !== studentId));

            closeJustifyModal();
        } catch (error) {
            console.error('Error al justificar faltas:', error);
            alert('Error al justificar las faltas. Por favor intenta de nuevo.');
        }
    };

    return (
        <div className="alertas-container">
            {/* Header */}
            <div className="alertas-page-header">
                <h1 className="alertas-page-title">Gestión de Alertas</h1>
                <p className="alertas-page-subtitle">Monitorea y justifica las faltas de los estudiantes</p>
            </div>

            {/* Controls */}
            <div className="alertas-controls">
                <div className="search-container">
                    <div className="search-input-wrapper">
                        <Search size={20} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Buscar por nombre o matrícula..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <button onClick={openHistoryModal} className="btn-history">
                    <History size={18} />
                    Ver Historial
                </button>
            </div>

            {/* Dashboard Controls (Turnos) */}
            <DashboardControls
                activeMode={activeMode}
                onModeChange={setActiveMode}
                onOpenHistory={openHistoryModal}
            />

            {/* Alerts Table */}
            {isLoading ? (
                <div className="alertas-table-card">
                    <div className="empty-alerts">
                        <div className="empty-alerts-title">Cargando alertas...</div>
                    </div>
                </div>
            ) : filteredAlertsList.length === 0 ? (
                <div className="alertas-table-card">
                    <div className="empty-alerts">
                        <CheckCircle className="empty-alerts-icon" />
                        <h3 className="empty-alerts-title">¡Todo en orden!</h3>
                        <p className="empty-alerts-text">
                            {searchQuery
                                ? 'No se encontraron estudiantes con ese criterio de búsqueda'
                                : 'No hay estudiantes con faltas injustificadas en este momento'}
                        </p>
                    </div>
                </div>
            ) : (
                <AlertsTable
                    alerts={filteredAlertsList}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onOpenJustifyModal={openJustifyModal}
                    onToggleHistory={toggleHistory}
                    expandedHistoryId={expandedHistoryId}
                />
            )}

            {/* Modal para justificar */}
            <JustifyModal
                isOpen={modalState.isOpen}
                onClose={closeJustifyModal}
                studentName={modalState.studentName}
                onSubmit={submitJustification}
            />

            {/* Modal de Historial */}
            <JustificationHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={closeHistoryModal}
                history={justificationHistory}
            />
        </div>
    );
};

export default AlertasPage;