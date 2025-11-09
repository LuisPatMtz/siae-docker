// src/pages/AlertasPage.jsx
import React, { useState, useEffect } from 'react';

import DashboardControls from '../components/Dashboard/DashboardControls.jsx';
import AlertsTable from '../components/Alerts/AlertsTable.jsx';
import JustifyModal from '../components/Alerts/JustifyModal.jsx';
// 1. Importa el nuevo modal de historial
import JustificationHistoryModal from '../components/Alerts/JustificationHistoryModal.jsx';

// --- NUEVA ESTRUCTURA DE DATOS DEFAULT (MOCK DATA) ---
// Asegúrate que Carlos y Ana estén incluidos aquí
const MOCK_ALERTS_DATA = {
    general: [
        { id: 3, nombre: 'Valentina Soto', grupo: '9A', unjustifiedFaltas: 5, unjustifiedDates: ['2025-10-15', '2025-10-16', '2025-10-18', '2025-10-19', '2025-10-21'] },
        { id: 6, nombre: 'Javier Gómez', grupo: '11C', unjustifiedFaltas: 4, unjustifiedDates: ['2025-10-10', '2025-10-11', '2025-10-17', '2025-10-20'] },
        { id: 1, nombre: 'Sofía Martínez', grupo: '9A', unjustifiedFaltas: 3, unjustifiedDates: ['2025-10-05', '2025-10-06', '2025-10-22'] },
        { id: 7, nombre: 'Carlos Ruiz', grupo: '10A', unjustifiedFaltas: 2, unjustifiedDates: ['2025-10-20', '2025-10-23'] },
        { id: 8, nombre: 'Ana Torres', grupo: '11B', unjustifiedFaltas: 1, unjustifiedDates: ['2025-10-24'] },
    ],
    matutino: [
        { id: 3, nombre: 'Valentina Soto', grupo: '9A', unjustifiedFaltas: 5, unjustifiedDates: ['2025-10-15', '2025-10-16', '2025-10-18', '2025-10-19', '2025-10-21'] },
        { id: 1, nombre: 'Sofía Martínez', grupo: '9A', unjustifiedFaltas: 3, unjustifiedDates: ['2025-10-05', '2025-10-06', '2025-10-22'] },
        { id: 7, nombre: 'Carlos Ruiz', grupo: '10A', unjustifiedFaltas: 2, unjustifiedDates: ['2025-10-20', '2025-10-23'] },
    ],
    vespertino: [
        { id: 6, nombre: 'Javier Gómez', grupo: '11C', unjustifiedFaltas: 4, unjustifiedDates: ['2025-10-10', '2025-10-11', '2025-10-17', '2025-10-20'] },
        { id: 8, nombre: 'Ana Torres', grupo: '11B', unjustifiedFaltas: 1, unjustifiedDates: ['2025-10-24'] },
    ],
};
// --- FIN DE DATOS DEFAULT ---


const AlertasPage = () => {
    const [activeMode, setActiveMode] = useState('general');
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [allAlertsList, setAllAlertsList] = useState([]);
    const [filteredAlertsList, setFilteredAlertsList] = useState([]);
    const [expandedHistoryId, setExpandedHistoryId] = useState(null);
    const [modalState, setModalState] = useState({ isOpen: false, studentId: null, studentName: '' });

    // --- NUEVOS ESTADOS PARA HISTORIAL ---
    const [justificationHistory, setJustificationHistory] = useState([]); // Guarda el historial
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false); // Controla visibilidad del modal historial
    // ------------------------------------

    // *** INTERRUPTOR #1: Cargar datos del TURNO ***
    useEffect(() => {
        setIsLoading(true);
        const fetchData = async () => {
            console.log(`Buscando alertas para: ${activeMode}`);
            try {
                // --- TODO: API GET /alertas?modo=... ---
                const data = MOCK_ALERTS_DATA[activeMode] || [];
                // --- TODO: API GET /historial_justificaciones?modo=... ---
                // Simulación: Reseteamos el historial local al cambiar de modo
                setJustificationHistory([]); 
                // ----------------------------------------

                setAllAlertsList(data);
                setFilteredAlertsList(data);
                setSearchQuery('');
                setExpandedHistoryId(null);
                setModalState({ isOpen: false, studentId: null, studentName: '' });
                setIsHistoryModalOpen(false); // Cierra modal historial al cambiar modo

            } catch (error) {
                console.error("Error al obtener alertas:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(() => fetchData(), 300);
        return () => clearTimeout(timer);

    }, [activeMode]);

    // *** INTERRUPTOR #2: Filtrar localmente por búsqueda ***
    useEffect(() => {
        const filtered = allAlertsList.filter(alert =>
            alert.nombre.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredAlertsList(filtered);
        // --- TODO: API ---
    }, [searchQuery, allAlertsList]);

    // --- FUNCIONES PARA MODALES Y HISTORIAL ---
    const toggleHistory = (studentId) => {
        setExpandedHistoryId(prevId => (prevId === studentId ? null : studentId));
    };
    const openJustifyModal = (studentId, studentName) => {
        setModalState({ isOpen: true, studentId, studentName });
    };
    const closeJustifyModal = () => {
        setModalState({ isOpen: false, studentId: null, studentName: '' });
    };

    // -- NUEVAS FUNCIONES PARA MODAL HISTORIAL --
    const openHistoryModal = () => setIsHistoryModalOpen(true);
    const closeHistoryModal = () => setIsHistoryModalOpen(false);
    // ------------------------------------------

    // *** INTERRUPTOR #3: Enviar justificación a la API ***
    const submitJustification = async (reason) => {
        const studentId = modalState.studentId;
        // Busca el nombre del estudiante en la lista original (antes de filtrarla)
        const studentName = allAlertsList.find(alert => alert.id === studentId)?.nombre || 'Desconocido'; 
        console.log(`API Call: Justificar faltas de ${studentId} (${studentName}) con motivo: "${reason}"`);

        // --- TODO: AQUÍ VA TU CÓDIGO DE API (POST/PATCH /justificar) ---
        await new Promise(resolve => setTimeout(resolve, 500)); // Simula éxito
        // --------------------------------------------------

        // Si la API tiene éxito:
        // 1. Añadimos al historial local
        const newHistoryEntry = {
            id: `hist-${Date.now()}`, // ID simple para el mock
            studentId: studentId,
            studentName: studentName,
            reason: reason,
            justifiedAt: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) // Fecha y hora actual formateada
        };
        setJustificationHistory(prevHistory => [newHistoryEntry, ...prevHistory]); // Añade al principio

        // 2. Eliminamos al alumno de las listas activas
        setAllAlertsList(prevList => prevList.filter(alert => alert.id !== studentId));
        // filteredAlertsList se actualizará automáticamente por el useEffect #2

        closeJustifyModal(); // Cierra el modal de justificación
    };


    return (
        <main className="dashboard-main">
            <div className="page-title-container">
                <h1 className="page-title">Panel de Gestión de Alertas</h1>
                <div className="title-decorator"></div>
            </div>

            {/* Pasamos el nuevo handler openHistoryModal a DashboardControls */}
            <DashboardControls
                activeMode={activeMode}
                onModeChange={setActiveMode}
                onOpenHistory={openHistoryModal} // <--- PROP PARA ABRIR HISTORIAL
            />

            {isLoading ? (
                 <div className="loading-message">Cargando alertas...</div>
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

            {/* Renderizamos el Modal de Historial */}
            <JustificationHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={closeHistoryModal}
                history={justificationHistory} // <--- Pasamos el historial
            />
        </main>
    );
};

export default AlertasPage;