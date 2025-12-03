// src/pages/GestionEstudiantesPage.jsx
import React, { useState, useEffect } from 'react';
import { PlusCircle, UserPlus, XCircle, Link2, Users, CheckCircle, AlertCircle, Edit3, Trash2, ChevronDown, Calendar, CalendarDays, Clock, RefreshCw, ArrowLeft, Home, Search } from 'lucide-react';
import apiClient from '../api/axios'; // Still needed for some local calls if any, or we can remove if all in hooks. 
// Actually, loadFormData in useEffect #2.8 uses apiClient directly. I should probably move that to a hook too or keep it.
// For now, I'll keep it here or move to useStudents? 
// The form data loading (grupos and ciclos) is specific to the "Add Student" form. 
// useStudents handles student list. 
// I'll keep apiClient for the form data loading for now to avoid over-complicating the hooks immediately, 
// or better, use the useGroups and useCycles hooks to fetch that data!
// useGroups and useCycles expose fetchGroups and fetchCycles. I can use those.

import StudentSemesterFilter from '../components/Students/StudentSemesterFilter.jsx';
import StudentLinkTable from '../components/Students/StudentLinkTable.jsx';
import LinkNfcModal from '../components/Students/LinkNfcModal.jsx';
import BulkChangeModal from '../components/Students/BulkChangeModal.jsx';
import CreateGroupModal from '../components/Groups/CreateGroupModal.jsx';
import EditGroupModal from '../components/Groups/EditGroupModal.jsx';
import DeleteGroupModal from '../components/Groups/DeleteGroupModal.jsx';
import CreateCycleModal from '../components/SchoolCycles/CreateCycleModal.jsx';
import PageContainer from '../components/Common/PageContainer.jsx';
import EditCycleModal from '../components/SchoolCycles/EditCycleModal.jsx';
import SetupWizard from '../components/SetupWizard/SetupWizard.jsx';
import DeleteCycleModal from '../components/SchoolCycles/DeleteCycleModal.jsx';
import StudentManagementModal from '../components/Students/StudentManagementModal.jsx';
import GroupManagementModal from '../components/Groups/GroupManagementModal.jsx';
import SchoolCyclesManagementModal from '../components/SchoolCycles/SchoolCyclesManagementModal.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import Modal from '../components/UI/Modal.jsx';
import useEscapeKey from '../hooks/useEscapeKey';

// Custom Hooks
import useStudents from '../hooks/useStudents';
import useGroups from '../hooks/useGroups';
import useCycles from '../hooks/useCycles';

const GestionEstudiantesPage = () => {
    // Estado para visibilidad de formularios
    const [isAddFormVisible, setIsAddFormVisible] = useState(false);
    const [isLinkListViewVisible, setIsLinkListViewVisible] = useState(false);
    const [isGroupManagementVisible, setIsGroupManagementVisible] = useState(false);
    const [isSchoolCycleVisible, setIsSchoolCycleVisible] = useState(false);
    const [isStudentManagementModalOpen, setIsStudentManagementModalOpen] = useState(false);
    const [isGroupManagementModalOpen, setIsGroupManagementModalOpen] = useState(false);
    const [isSchoolCyclesManagementModalOpen, setIsSchoolCyclesManagementModalOpen] = useState(false);
    const [showSetupWizard, setShowSetupWizard] = useState(false);
    const [setupStep, setSetupStep] = useState(null);
    const [isCheckingSystem, setIsCheckingSystem] = useState(true);

    // Hooks
    const {
        allStudents, filteredStudents, isLoading: isLoadingStudents, isSaving: isSavingStudent,
        linkSearchTerm, setLinkSearchTerm, linkSelectedGroup, setLinkSelectedGroup, linkNfcFilter, setLinkNfcFilter,
        saveStudent, linkNfc, bulkMoveGroup, fetchStudents
    } = useStudents(isLinkListViewVisible);

    const {
        grupos, isLoadingGroups, createGroup, updateGroup, deleteGroup, fetchGroups
    } = useGroups(isGroupManagementVisible);

    const {
        ciclosEscolares, isLoadingCycles, createCycle, updateCycle, deleteCycle, toggleCycleStatus, fetchCycles
    } = useCycles(isSchoolCycleVisible);

    // Estados locales para UI (Modales y Formularios)

    // Grupos UI
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    const [isAddingGroup, setIsAddingGroup] = useState(false);
    const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
    const [groupToEdit, setGroupToEdit] = useState(null);
    const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);
    const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState(null);
    const [isDeletingGroup, setIsDeletingGroup] = useState(false);
    const [collapsedSemesters, setCollapsedSemesters] = useState(new Set());

    // Ciclos UI
    const [activeCycle, setActiveCycle] = useState(null); // Still used? The hook has logic but maybe we need local state for UI highlighting if not in data?
    // The hook returns ciclosEscolares which has 'activo' field. We can derive activeCycle from that.
    const [isCreateCycleModalOpen, setIsCreateCycleModalOpen] = useState(false);
    const [isCreatingCycle, setIsCreatingCycle] = useState(false);
    const [isEditingCycle, setIsEditingCycle] = useState(false);
    const [isDeletingCycle, setIsDeletingCycle] = useState(false);
    const [cycleToEdit, setCycleToEdit] = useState(null);
    const [cycleToDelete, setCycleToDelete] = useState(null);

    // Formulario Agregar Estudiante UI
    const [gruposDisponibles, setGruposDisponibles] = useState([]);
    const [ciclosDisponibles, setCiclosDisponibles] = useState([]);
    const [isLoadingFormData, setIsLoadingFormData] = useState(false);
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [matricula, setMatricula] = useState('');
    const [correo, setCorreo] = useState('');
    const [idGrupo, setIdGrupo] = useState('');
    const [idCiclo, setIdCiclo] = useState('');

    // Vincular NFC UI
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [studentToLink, setStudentToLink] = useState(null);

    // Bulk Change UI
    const [isBulkChangeModalOpen, setIsBulkChangeModalOpen] = useState(false);
    const [bulkChangeType, setBulkChangeType] = useState('');
    const [isProcessingBulkChange, setIsProcessingBulkChange] = useState(false);

    const { showSuccess, showError, showWarning } = useToast();

    // Función para verificar el estado del sistema
    const checkSystemStatus = async () => {
        setIsCheckingSystem(true);
        try {
            const response = await apiClient.get('/api/auth/check-system');
            const { has_cycles, has_groups } = response.data;

            if (!has_cycles) {
                setSetupStep('create-cycle');
                setShowSetupWizard(true);
            } else if (!has_groups) {
                setSetupStep('create-groups');
                setShowSetupWizard(true);
            } else {
                setShowSetupWizard(false);
            }
        } catch (error) {
            console.error('Error al verificar estado del sistema:', error);
        } finally {
            setIsCheckingSystem(false);
        }
    };

    // Verificar estado del sistema al cargar
    useEffect(() => {
        checkSystemStatus();
    }, []);

    // Helper for modals
    const addToast = (message, type) => {
        switch (type) {
            case 'success': showSuccess(message); break;
            case 'error': showError(message); break;
            case 'warning': showWarning(message); break;
            default: showSuccess(message);
        }
    };

    // Control de Vistas
    const clearFields = () => {
        setNombre(''); setApellido(''); setMatricula(''); setCorreo(''); setIdGrupo(''); setIdCiclo('');
        setStudentToLink(null); setSelectedStudents([]);
    };

    const showAddForm = () => { setIsAddFormVisible(true); setIsLinkListViewVisible(false); setIsGroupManagementVisible(false); setIsSchoolCycleVisible(false); clearFields(); };
    const hideAddForm = () => setIsAddFormVisible(false);
    const showLinkListView = () => {
        setIsLinkListViewVisible(true);
        setIsAddFormVisible(false);
        setIsGroupManagementVisible(false);
        setIsSchoolCycleVisible(false);
        clearFields();
    };
    const hideLinkListView = () => {
        setIsLinkListViewVisible(false);
        setLinkSearchTerm('');
        setLinkSelectedGroup('');
        setLinkNfcFilter('all');
    };
    const showGroupManagement = () => { setIsGroupManagementVisible(true); setIsAddFormVisible(false); setIsLinkListViewVisible(false); setIsSchoolCycleVisible(false); clearFields(); };
    const hideGroupManagement = () => setIsGroupManagementVisible(false);
    const showSchoolCycleManagement = () => { setIsSchoolCycleVisible(true); setIsAddFormVisible(false); setIsLinkListViewVisible(false); setIsGroupManagementVisible(false); clearFields(); };
    const hideSchoolCycleManagement = () => setIsSchoolCycleVisible(false);

    useEscapeKey(() => {
        if (isLinkListViewVisible) hideLinkListView();
    }, isLinkListViewVisible);

    // Selection Logic
    const handleSelectStudent = (matricula) => {
        setSelectedStudents(prev => prev.includes(matricula) ? prev.filter(m => m !== matricula) : [...prev, matricula]);
    };

    const handleSelectAll = (checked) => {
        setSelectedStudents(checked ? filteredStudents.map(s => s.matricula) : []);
    };

    // Load Form Data for Add Student
    useEffect(() => {
        if (!isAddFormVisible) return;

        const loadFormData = async () => {
            setIsLoadingFormData(true);
            try {
                // We can use the hooks' fetch functions if we want, but they set the main state.
                // For the dropdowns, we might want independent lists or reuse the main ones.
                // Since useGroups and useCycles are conditionally fetching based on visibility,
                // we might need to fetch explicitly here if those views aren't open.
                // Or we can just use apiClient here as before to be safe and simple.
                const [gruposResponse, ciclosResponse] = await Promise.all([
                    apiClient.get('/api/grupos'),
                    apiClient.get('/api/ciclos')
                ]);

                setGruposDisponibles(gruposResponse.data);
                setCiclosDisponibles(ciclosResponse.data);

                const cicloActivo = ciclosResponse.data.find(ciclo => ciclo.activo);
                if (cicloActivo) setIdCiclo(cicloActivo.id.toString());

            } catch (error) {
                console.error("Error cargando datos del formulario:", error);
                showError('Error al cargar grupos y ciclos disponibles');
            } finally {
                setIsLoadingFormData(false);
            }
        };

        loadFormData();
    }, [isAddFormVisible, showError]);


    // Handlers
    const handleSaveStudent = async (e) => {
        e.preventDefault();

        if (!nombre.trim() || !apellido.trim() || !matricula.trim() || !correo.trim() || !idGrupo || !idCiclo) {
            showError('Por favor, completa todos los campos obligatorios');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            showError('Por favor, ingresa un correo electrónico válido');
            return;
        }

        const newStudentData = {
            matricula: matricula.trim(),
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            correo: correo.trim(),
            id_grupo: parseInt(idGrupo),
            id_ciclo: parseInt(idCiclo)
        };

        const success = await saveStudent(newStudentData);
        if (success) clearFields();
    };

    const openLinkModal = (student) => {
        setStudentToLink(student);
        setIsLinkModalOpen(true);
    };
    const closeLinkModal = () => {
        setIsLinkModalOpen(false);
        setStudentToLink(null);
    };

    const submitNfcLink = async (nfcId) => {
        const success = await linkNfc(nfcId, studentToLink);
        if (success || !success) { // Always close modal? Original code closed it even on error?
            // Original: closeLinkModal() inside try and catch.
            closeLinkModal();
        }
    };

    // Bulk Change
    const handleBulkChangeGroup = () => {
        setBulkChangeType('group');
        setIsBulkChangeModalOpen(true);
    };

    const handleBulkChangeSemester = () => {
        setBulkChangeType('semester');
        setIsBulkChangeModalOpen(true);
    };

    const handleConfirmBulkChange = async (value) => {
        setIsProcessingBulkChange(true);
        const success = await bulkMoveGroup(selectedStudents, value);
        setIsProcessingBulkChange(false);
        if (success) {
            setSelectedStudents([]);
            setIsBulkChangeModalOpen(false);
        }
    };

    // Group Handlers
    const handleCreateGroup = async (groupData) => {
        setIsAddingGroup(true);
        try {
            await createGroup(groupData);
            setIsCreateGroupModalOpen(false); // Close modal on success
        } catch (error) {
            // Error handled in hook (toast), but we need to keep modal open?
            // The hook throws error, so we catch it here.
            // If hook throws, we don't close modal.
        } finally {
            setIsAddingGroup(false);
        }
    };

    const handleUpdateGroup = async (groupData) => {
        setIsUpdatingGroup(true);
        try {
            await updateGroup(groupToEdit.id, groupData);
            closeEditModal();
        } catch (error) {
            // Error handled in hook
        } finally {
            setIsUpdatingGroup(false);
        }
    };

    const openEditModal = (grupo) => {
        setGroupToEdit(grupo);
        setIsEditGroupModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditGroupModalOpen(false);
        setGroupToEdit(null);
    };

    const handleDeleteGroup = async () => {
        if (!groupToDelete) return;
        setIsDeletingGroup(true);
        try {
            const success = await deleteGroup(groupToDelete.id, groupToDelete.nombre);
            if (success) closeDeleteModal();
        } finally {
            setIsDeletingGroup(false);
        }
    };

    const openDeleteModal = (grupo) => {
        setGroupToDelete(grupo);
        setIsDeleteConfirmModalOpen(true);
    };

    const closeDeleteModal = () => {
        if (!isDeletingGroup) {
            setIsDeleteConfirmModalOpen(false);
            setGroupToDelete(null);
        }
    };

    const toggleSemesterCollapse = (semestre) => {
        setCollapsedSemesters(prev => {
            const newSet = new Set(prev);
            if (newSet.has(semestre)) newSet.delete(semestre);
            else newSet.add(semestre);
            return newSet;
        });
    };

    // Cycle Handlers
    const handleCreateCycle = async (cycleData) => {
        setIsCreatingCycle(true);
        try {
            const success = await createCycle(cycleData);
            if (success) setIsCreateCycleModalOpen(false);
        } finally {
            setIsCreatingCycle(false);
        }
    };

    const handleEditCycle = async (id, cycleData) => {
        setIsEditingCycle(true);
        try {
            const success = await updateCycle(id, cycleData);
            if (success) setCycleToEdit(null);
        } finally {
            setIsEditingCycle(false);
        }
    };

    const handleDeleteCycle = async () => {
        if (!cycleToDelete) return;
        setIsDeletingCycle(true);
        try {
            const success = await deleteCycle(cycleToDelete.id);
            if (success) setCycleToDelete(null);
        } finally {
            setIsDeletingCycle(false);
        }
    };

    const handleActivateCycle = async (cycleId) => {
        await toggleCycleStatus(cycleId);
    };

    const groupsBySemester = () => {
        if (grupos.length === 0) return {};
        return grupos.reduce((acc, grupo) => {
            const semestre = grupo.semestre || 'Sin semestre';
            if (!acc[semestre]) acc[semestre] = [];
            acc[semestre].push(grupo);
            return acc;
        }, {});
    };

    const formActive = isAddFormVisible || isLinkListViewVisible || isGroupManagementVisible || isSchoolCycleVisible;

    const getCurrentSection = () => {
        if (isLinkListViewVisible) return 'Vincular Matrícula con NFC';
        if (isGroupManagementVisible) return 'Gestión de Grupos';
        if (isSchoolCycleVisible) return 'Gestión de Ciclo Escolar';
        if (isAddFormVisible) return 'Agregar Estudiante';
        return null;
    };

    return (
        <PageContainer>
            <main className="dashboard-main">
                {/* Breadcrumbs */}
                {/* Page Header - Only show when no forms active */}
                {!formActive && (
                    <div className="page-title-container">
                        <h1 className="page-title">Gestión de Estudiantes</h1>
                    </div>
                )}

            {formActive && (
                <div className="breadcrumbs-nav">
                    <button onClick={() => {
                        hideAddForm();
                        hideLinkListView();
                        hideGroupManagement();
                        hideSchoolCycleManagement();
                    }} className="breadcrumb-back-btn">
                        <ArrowLeft size={18} />
                        <span>Volver al menú</span>
                    </button>
                    <div className="breadcrumb-path">
                        <Home size={16} />
                        <span className="breadcrumb-separator">/</span>
                        <span className="breadcrumb-current">{getCurrentSection()}</span>
                    </div>
                </div>
            )}

            <div className={`student-management-container ${formActive ? 'form-active' : ''}`}>

                {/* Card/Button 1: Gestión de Alumnado */}
                <div className={`action-trigger-card student-management-card ${formActive ? 'hidden' : ''}`} onClick={() => setIsStudentManagementModalOpen(true)}>
                    <Users size={64} className="student-icon" />
                    <span>Gestión de Alumnado</span>
                </div>

                {/* Card/Button 2: Vincular NFC */}
                <div className={`action-trigger-card link-nfc-card ${formActive ? 'hidden' : ''}`} onClick={showLinkListView}>
                    <Link2 size={64} className="link-icon" />
                    <span>Vincular Matrícula con NFC</span>
                </div>

                {/* Card/Button 3: Gestión de Grupos */}
                <div className={`action-trigger-card group-management-card ${formActive ? 'hidden' : ''}`} onClick={() => setIsGroupManagementModalOpen(true)}>
                    <Users size={64} className="group-icon" />
                    <span>Gestión de Grupos</span>
                </div>

                {/* Card/Button 4: Gestión de Ciclo Escolar */}
                <div className={`action-trigger-card school-cycle-card ${formActive ? 'hidden' : ''}`} onClick={() => setIsSchoolCyclesManagementModalOpen(true)}>
                    <Calendar size={64} className="calendar-icon" />
                    <span>Gestión de Ciclo Escolar</span>
                </div>

                {/* ----- FORMULARIO 1: AGREGAR ESTUDIANTE (Condicional) ----- */}
                {isAddFormVisible && (
                    <div className="student-form-card card">
                        <div className="form-header">
                            <h2 className="card-title">Datos del Nuevo Estudiante</h2>
                            <button onClick={hideAddForm} className="close-form-btn" title="Cerrar formulario"><XCircle size={24} /></button>
                        </div>
                        {isLoadingFormData ? (
                            <div className="loading-message">Cargando datos del formulario...</div>
                        ) : (
                            <form onSubmit={handleSaveStudent}>
                                <div className="form-grid">
                                    <div className="modal-input-group">
                                        <label htmlFor="studentNombre">Nombre(s): *</label>
                                        <input
                                            type="text"
                                            id="studentNombre"
                                            value={nombre}
                                            onChange={(e) => setNombre(e.target.value)}
                                            placeholder="Ej: Juan Carlos"
                                            required
                                        />
                                    </div>
                                    <div className="modal-input-group">
                                        <label htmlFor="studentApellido">Apellido(s): *</label>
                                        <input
                                            type="text"
                                            id="studentApellido"
                                            value={apellido}
                                            onChange={(e) => setApellido(e.target.value)}
                                            placeholder="Ej: Pérez González"
                                            required
                                        />
                                    </div>
                                    <div className="modal-input-group">
                                        <label htmlFor="studentMatricula">Matrícula: *</label>
                                        <input
                                            type="text"
                                            id="studentMatricula"
                                            value={matricula}
                                            onChange={(e) => setMatricula(e.target.value)}
                                            placeholder="Ej: S2001"
                                            required
                                        />
                                    </div>
                                    <div className="modal-input-group">
                                        <label htmlFor="studentCorreo">Correo Electrónico: *</label>
                                        <input
                                            type="email"
                                            id="studentCorreo"
                                            value={correo}
                                            onChange={(e) => setCorreo(e.target.value)}
                                            placeholder="Ej: juan.perez@email.com"
                                            required
                                        />
                                    </div>
                                    <div className="modal-input-group">
                                        <label htmlFor="studentGrupo">Grupo: *</label>
                                        <select
                                            id="studentGrupo"
                                            value={idGrupo}
                                            onChange={(e) => setIdGrupo(e.target.value)}
                                            required
                                        >
                                            <option value="">Selecciona un grupo</option>
                                            {gruposDisponibles.map(grupo => (
                                                <option key={grupo.id} value={grupo.id}>
                                                    {grupo.nombre ?
                                                        `${grupo.nombre} (${grupo.semestre}° Sem - ${grupo.turno})` :
                                                        `Grupo ${grupo.id} (${grupo.semestre}° Sem - ${grupo.turno})`
                                                    }
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="modal-input-group">
                                        <label htmlFor="studentCiclo">Ciclo Escolar: *</label>
                                        <select
                                            id="studentCiclo"
                                            value={idCiclo}
                                            onChange={(e) => setIdCiclo(e.target.value)}
                                            required
                                        >
                                            <option value="">Selecciona un ciclo</option>
                                            {ciclosDisponibles.map(ciclo => (
                                                <option key={ciclo.id} value={ciclo.id}>
                                                    {ciclo.nombre} {ciclo.activo ? '(Activo)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="action-button clear-button" onClick={clearFields} disabled={isSavingStudent}>
                                        Limpiar Campos
                                    </button>
                                    <button type="submit" className="action-button save-button" disabled={isSavingStudent}>
                                        <UserPlus size={18} />
                                        {isSavingStudent ? 'Guardando...' : 'Guardar Nuevo Estudiante'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* ----- VISTA 2: VINCULAR NFC (Modal) ----- */}
                {isLinkListViewVisible && (
                    <Modal
                        isOpen={isLinkListViewVisible}
                        onClose={hideLinkListView}
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Link2 size={20} />
                                Vincular Tarjetas NFC
                            </div>
                        }
                        size="xl"
                    >
                        <div className="student-management-content">
                            <div className="management-controls">
                                <div className="search-input-group">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, apellido o matrícula..."
                                        value={linkSearchTerm}
                                        onChange={(e) => setLinkSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                </div>

                                <select
                                    value={linkSelectedGroup}
                                    onChange={(e) => setLinkSelectedGroup(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="">Todos los Grupos</option>
                                    {grupos.map(group => (
                                        <option key={group.id} value={group.id}>
                                            {group.nombre}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={linkNfcFilter}
                                    onChange={(e) => setLinkNfcFilter(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="all">Todos los Estados</option>
                                    <option value="linked">Vinculados</option>
                                    <option value="unlinked">No Vinculados</option>
                                </select>
                            </div>

                            {selectedStudents.length > 0 && (
                                <div className="bulk-actions-floating">
                                    <div className="bulk-actions-content">
                                        <span className="selection-count">
                                            <CheckCircle size={16} />
                                            {selectedStudents.length} seleccionado(s)
                                        </span>
                                        <select
                                            className="bulk-select"
                                            value=""
                                            onChange={(e) => {
                                                if (e.target.value === 'changeGroup') {
                                                    handleBulkChangeGroup();
                                                } else if (e.target.value === 'changeSemester') {
                                                    handleBulkChangeSemester();
                                                }
                                            }}
                                        >
                                            <option value="" disabled>Acciones masivas...</option>
                                            <option value="changeGroup">Cambiar Grupo</option>
                                            <option value="changeSemester">Cambiar Semestre</option>
                                        </select>
                                        <button
                                            className="bulk-clear-btn"
                                            onClick={() => setSelectedStudents([])}
                                            title="Limpiar selección"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="students-table-wrapper">
                                {isLoadingStudents ? (
                                    <div className="empty-state">
                                        <p>Cargando estudiantes...</p>
                                    </div>
                                ) : (
                                    <StudentLinkTable
                                        students={filteredStudents}
                                        onOpenLinkModal={openLinkModal}
                                        selectedStudents={selectedStudents}
                                        onSelectStudent={handleSelectStudent}
                                        onSelectAll={handleSelectAll}
                                    />
                                )}
                            </div>
                        </div>
                    </Modal>
                )}

                {/* ----- VISTA 3: GESTIÓN DE GRUPOS (Condicional) ----- */}
                {isGroupManagementVisible && (
                    <div className="group-management-view card">
                        <div className="form-header">
                            <h2 className="card-title">Gestión de Grupos</h2>
                            <button onClick={hideGroupManagement} className="close-form-btn" title="Cerrar vista">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="groups-list-section main-section">
                            <div className="section-header">
                                <div className="title-group">
                                    <h3 className="form-section-title">Grupos Existentes</h3>
                                    {grupos.length > 0 && (
                                        <span className="groups-counter">
                                            {grupos.length} grupo{grupos.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    className="action-button add-button compact"
                                    onClick={() => setIsCreateGroupModalOpen(true)}
                                    disabled={isLoadingGroups}
                                    title="Crear nuevo grupo"
                                >
                                    <PlusCircle size={16} />
                                    Nuevo Grupo
                                </button>
                            </div>

                            {isLoadingGroups ? (
                                <div className="loading-message">Cargando grupos...</div>
                            ) : grupos.length === 0 ? (
                                <div className="no-groups-message">
                                    <Users size={64} className="placeholder-icon" />
                                    <h4>No hay grupos creados aún</h4>
                                    <p>Los grupos te permiten organizar estudiantes por semestre y turno.</p>
                                    <button
                                        type="button"
                                        className="action-button add-button"
                                        onClick={() => setIsCreateGroupModalOpen(true)}
                                    >
                                        <PlusCircle size={18} />
                                        Crear mi primer grupo
                                    </button>
                                </div>
                            ) : (
                                <div className="groups-by-semester">
                                    {Object.entries(groupsBySemester())
                                        .sort(([a], [b]) => {
                                            if (a === 'Sin semestre') return 1;
                                            if (b === 'Sin semestre') return -1;
                                            return parseInt(a) - parseInt(b);
                                        })
                                        .map(([semestre, gruposSemestre]) => (
                                            <div key={semestre} className="semester-section">
                                                <button
                                                    className="semester-title-button"
                                                    onClick={() => toggleSemesterCollapse(semestre)}
                                                    aria-expanded={!collapsedSemesters.has(semestre)}
                                                >
                                                    <h4 className="semester-title">
                                                        {semestre === 'Sin semestre' ?
                                                            'Grupos sin semestre asignado' :
                                                            `${semestre}° Semestre`
                                                        }
                                                        <span className="semester-count">
                                                            ({gruposSemestre.length} grupo{gruposSemestre.length !== 1 ? 's' : ''})
                                                        </span>
                                                    </h4>
                                                    <ChevronDown
                                                        size={20}
                                                        className={`semester-chevron ${collapsedSemesters.has(semestre) ? 'collapsed' : ''}`}
                                                    />
                                                </button>

                                                <div className={`semester-content ${collapsedSemesters.has(semestre) ? 'collapsed' : 'expanded'}`}>
                                                    <div className="groups-grid">
                                                        {gruposSemestre.map((grupo) => (
                                                            <div key={grupo.id} className="group-card">
                                                                <div className="group-card-header">
                                                                    <div className="group-info-section">
                                                                        <h4 className="group-name">
                                                                            {grupo.nombre ? grupo.nombre : `Sin nombre (ID: ${grupo.id})`}
                                                                        </h4>
                                                                        <div className="group-badges">
                                                                            <span className="group-turno">{grupo.turno}</span>
                                                                            <span className="group-semestre">{grupo.semestre}° Sem</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="group-actions">
                                                                        <button
                                                                            className="edit-group-btn"
                                                                            onClick={() => openEditModal(grupo)}
                                                                            title="Editar grupo"
                                                                        >
                                                                            <Edit3 size={18} />
                                                                        </button>
                                                                        <button
                                                                            className="delete-group-btn"
                                                                            onClick={() => openDeleteModal(grupo)}
                                                                            title="Eliminar grupo"
                                                                        >
                                                                            <Trash2 size={18} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="group-card-body">
                                                                    {grupo.nombre === "" && (
                                                                        <p className="group-warning">
                                                                            ⚠️ Este grupo no tiene nombre asignado
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ----- VISTA 4: GESTIÓN DE CICLOS ESCOLARES (Condicional) ----- */}
                {isSchoolCycleVisible && (
                    <div className="cycle-management-wrapper">
                        <div className="cycle-management-view card">
                            <div className="form-header">
                                <h2 className="card-title">Gestión de Ciclos Escolares</h2>
                                <button onClick={hideSchoolCycleManagement} className="close-form-btn" title="Cerrar vista">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="feature-description">
                                <p>Administra los periodos académicos de tu institución. Solo un ciclo puede estar activo a la vez.</p>
                            </div>

                            <div className="cycles-list-section main-section">
                                <div className="section-header">
                                    <div className="title-group">
                                        <h3 className="form-section-title">Ciclos Escolares</h3>
                                        {ciclosEscolares.length > 0 && (
                                            <span className="groups-counter">
                                                {ciclosEscolares.length} ciclo{ciclosEscolares.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        className="action-button add-button compact"
                                        onClick={() => setIsCreateCycleModalOpen(true)}
                                        disabled={isLoadingCycles}
                                        title="Crear nuevo ciclo escolar"
                                    >
                                        <PlusCircle size={16} />
                                        Nuevo Ciclo
                                    </button>
                                </div>

                                {isLoadingCycles ? (
                                    <div className="loading-message">Cargando ciclos escolares...</div>
                                ) : ciclosEscolares.length === 0 ? (
                                    <div className="no-groups-message">
                                        <Calendar size={80} className="placeholder-icon" />
                                        <h4>No hay ciclos escolares creados aún</h4>
                                        <p>Los ciclos escolares te permiten organizar tus periodos académicos por semestres o años</p>
                                        <button
                                            className="action-button add-button"
                                            onClick={() => setIsCreateCycleModalOpen(true)}
                                        >
                                            <PlusCircle size={16} />
                                            Crear primer ciclo
                                        </button>
                                    </div>
                                ) : (
                                    <div className="cycles-grid">
                                        {ciclosEscolares.map((ciclo) => (
                                            <div
                                                key={ciclo.id}
                                                className={`cycle-card ${ciclo.activo ? 'active-cycle' : ''}`}
                                            >
                                                <div className="cycle-header">
                                                    <div className="cycle-info">
                                                        <h4 className="cycle-name">{ciclo.nombre}</h4>
                                                        {ciclo.activo && (
                                                            <span className="active-badge">
                                                                <CheckCircle size={12} />
                                                                Activo
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="cycle-dates">
                                                    <div className="date-info">
                                                        <span className="date-label">
                                                            <CalendarDays size={10} />
                                                            Inicio
                                                        </span>
                                                        <span className="date-value">
                                                            {new Date(ciclo.fecha_inicio).toLocaleDateString('es-ES', {
                                                                day: '2-digit',
                                                                month: 'short'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="date-info">
                                                        <span className="date-label">
                                                            <Clock size={10} />
                                                            Fin
                                                        </span>
                                                        <span className="date-value">
                                                            {new Date(ciclo.fecha_fin).toLocaleDateString('es-ES', {
                                                                day: '2-digit',
                                                                month: 'short'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="cycle-actions">
                                                    {!ciclo.activo && (
                                                        <button
                                                            onClick={() => handleActivateCycle(ciclo.id)}
                                                            className="action-button activate-button"
                                                            title="Marcar como ciclo activo"
                                                        >
                                                            <CheckCircle size={16} />
                                                            <span>Activar</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setCycleToEdit(ciclo)}
                                                        className="action-button edit-button"
                                                        title="Editar nombre y fechas"
                                                        disabled={isEditingCycle}
                                                    >
                                                        <Edit3 size={16} />
                                                        <span>Editar</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setCycleToDelete(ciclo)}
                                                        className="action-button delete-button"
                                                        title="Eliminar ciclo permanentemente"
                                                        disabled={isDeletingCycle}
                                                    >
                                                        <Trash2 size={16} />
                                                        <span>Eliminar</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <LinkNfcModal
                isOpen={isLinkModalOpen}
                onClose={closeLinkModal}
                onSubmit={submitNfcLink}
                studentName={studentToLink ? `${studentToLink.nombre} ${studentToLink.apellido}` : ''}
                isSaving={isSavingStudent}
            />

            <BulkChangeModal
                isOpen={isBulkChangeModalOpen}
                onClose={() => setIsBulkChangeModalOpen(false)}
                onConfirm={handleConfirmBulkChange}
                isProcessing={isProcessingBulkChange}
                selectedCount={selectedStudents.length}
                changeType={bulkChangeType}
                availableGroups={grupos}
                availableSemesters={[1, 2, 3, 4, 5, 6]}
            />

            <CreateGroupModal
                isOpen={isCreateGroupModalOpen}
                onClose={() => setIsCreateGroupModalOpen(false)}
                onSubmit={handleCreateGroup}
                isCreating={isAddingGroup}
            />

            <EditGroupModal
                isOpen={isEditGroupModalOpen}
                onClose={closeEditModal}
                onSubmit={handleUpdateGroup}
                isLoading={isUpdatingGroup}
                groupData={groupToEdit}
            />

            <DeleteGroupModal
                isOpen={isDeleteConfirmModalOpen}
                onClose={closeDeleteModal}
                onConfirm={handleDeleteGroup}
                isDeleting={isDeletingGroup}
                groupData={groupToDelete}
            />

            <CreateCycleModal
                isOpen={isCreateCycleModalOpen}
                onClose={() => setIsCreateCycleModalOpen(false)}
                onSubmit={handleCreateCycle}
                isCreating={isCreatingCycle}
            />

            <EditCycleModal
                isOpen={!!cycleToEdit}
                onClose={() => setCycleToEdit(null)}
                onSubmit={handleEditCycle}
                isEditing={isEditingCycle}
                cycleData={cycleToEdit}
            />

            <DeleteCycleModal
                isOpen={!!cycleToDelete}
                onClose={() => setCycleToDelete(null)}
                onConfirm={handleDeleteCycle}
                isDeleting={isDeletingCycle}
                cycleData={cycleToDelete}
            />

            <StudentManagementModal
                isOpen={isStudentManagementModalOpen}
                onClose={() => setIsStudentManagementModalOpen(false)}
                onSuccess={addToast}
            />

            <GroupManagementModal
                isOpen={isGroupManagementModalOpen}
                onClose={() => {
                    setIsGroupManagementModalOpen(false);
                    // Verificar el estado del sistema para cerrar el setup wizard si todo está completo
                    checkSystemStatus();
                }}
                onSuccess={(message, type) => {
                    addToast(message, type);
                    // Verificar el estado después de crear un grupo
                    checkSystemStatus();
                }}
            />

            <SchoolCyclesManagementModal
                isOpen={isSchoolCyclesManagementModalOpen}
                onClose={() => {
                    setIsSchoolCyclesManagementModalOpen(false);
                    // Verificar el estado del sistema para continuar con el setup wizard
                    checkSystemStatus();
                }}
                onSuccess={(message, type) => {
                    addToast(message, type);
                    // Verificar el estado después de crear un ciclo
                    checkSystemStatus();
                }}
            />

            {/* Modal de configuración inicial del sistema */}
            {showSetupWizard && setupStep && (
                <SetupWizard
                    step={setupStep}
                    onComplete={() => {
                        setShowSetupWizard(false);
                        // Solo recargar si el setup está realmente completo
                        checkSystemStatus();
                    }}
                    onClose={() => setShowSetupWizard(false)}
                    onOpenCycleModal={() => {
                        setShowSetupWizard(false);
                        setIsSchoolCyclesManagementModalOpen(true);
                    }}
                    onOpenGroupModal={() => {
                        setShowSetupWizard(false);
                        setIsGroupManagementModalOpen(true);
                    }}
                />
            )}
            </main>
        </PageContainer>
    );
};

export default GestionEstudiantesPage;