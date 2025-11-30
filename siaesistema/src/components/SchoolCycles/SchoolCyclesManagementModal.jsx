// src/components/SchoolCycles/SchoolCyclesManagementModal.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Calendar, X, CheckCircle, Power } from 'lucide-react';
import axiosInstance from '../../api/axios';
import Modal from '../UI/Modal';
import '../../styles/modals/SharedModalStyles.css';
import '../../styles/modals/GroupManagementModal.css';
import '../../styles/modals/SchoolCyclesManagementModal.css';

const SchoolCyclesManagementModal = ({ isOpen, onClose, onSuccess }) => {
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingCycle, setEditingCycle] = useState(null);
    const [deletingCycleId, setDeletingCycleId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Estados para el formulario
    const [formData, setFormData] = useState({
        nombre: '',
        fecha_inicio: '',
        fecha_fin: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar datos cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            fetchCycles();
        }
    }, [isOpen]);

    const fetchCycles = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/api/ciclos/');
            console.log('Response from /api/ciclos/:', response.data);
            setCycles(response.data || []);
        } catch (error) {
            console.error('Error al cargar ciclos:', error);
            console.error('Error response:', error.response);
            setCycles([]);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar ciclos
    const filteredCycles = cycles.filter(cycle => {
        const matchesSearch = cycle.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Manejar cambios en el formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Limpiar error del campo
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validar formulario
    const validateForm = () => {
        const errors = {};

        if (!formData.nombre.trim()) {
            errors.nombre = 'El nombre del ciclo es obligatorio';
        }

        if (!formData.fecha_inicio) {
            errors.fecha_inicio = 'La fecha de inicio es obligatoria';
        }

        if (!formData.fecha_fin) {
            errors.fecha_fin = 'La fecha de fin es obligatoria';
        }

        if (formData.fecha_inicio && formData.fecha_fin) {
            const fechaInicio = new Date(formData.fecha_inicio);
            const fechaFin = new Date(formData.fecha_fin);

            if (fechaFin <= fechaInicio) {
                errors.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Enviar formulario (crear o editar)
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const dataToSend = {
                nombre: formData.nombre.trim(),
                fecha_inicio: formData.fecha_inicio,
                fecha_fin: formData.fecha_fin,
                activo: false // Los nuevos ciclos se crean inactivos
            };

            if (editingCycle) {
                // Actualizar ciclo existente
                await axiosInstance.put(`/api/ciclos/${editingCycle.id}`, dataToSend);
            } else {
                // Crear nuevo ciclo
                await axiosInstance.post('/api/ciclos/', dataToSend);
            }

            // Limpiar formulario
            setFormData({
                nombre: '',
                fecha_inicio: '',
                fecha_fin: ''
            });
            setFormErrors({});
            setShowForm(false);
            setEditingCycle(null);

            // Recargar datos
            await fetchCycles();

            // Notificar éxito
            if (onSuccess) {
                onSuccess(editingCycle ? 'Ciclo actualizado exitosamente' : 'Ciclo creado exitosamente', 'success');
            }
        } catch (error) {
            console.error('Error al guardar ciclo:', error);
            setFormErrors({
                submit: error.response?.data?.detail || `Error al ${editingCycle ? 'actualizar' : 'crear'} el ciclo`
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Manejar edición de ciclo
    const handleEdit = (cycle) => {
        setEditingCycle(cycle);
        setFormData({
            nombre: cycle.nombre,
            fecha_inicio: cycle.fecha_inicio,
            fecha_fin: cycle.fecha_fin
        });
        setShowForm(true);
    };

    // Manejar confirmación de eliminación
    const handleDeleteClick = (cycleId) => {
        setDeletingCycleId(cycleId);
        setShowDeleteConfirm(true);
    };

    // Eliminar ciclo
    const handleDelete = async () => {
        if (!deletingCycleId) return;

        setIsSubmitting(true);
        try {
            await axiosInstance.delete(`/api/ciclos/${deletingCycleId}`);

            // Recargar datos
            await fetchCycles();

            // Notificar éxito
            if (onSuccess) {
                onSuccess('Ciclo eliminado exitosamente', 'success');
            }

            setShowDeleteConfirm(false);
            setDeletingCycleId(null);
        } catch (error) {
            console.error('Error al eliminar ciclo:', error);
            if (onSuccess) {
                onSuccess(error.response?.data?.detail || 'Error al eliminar el ciclo', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Activar ciclo
    const handleActivate = async (cycleId) => {
        try {
            await axiosInstance.post(`/api/ciclos/${cycleId}/activar`, {});

            // Recargar datos
            await fetchCycles();

            // Notificar éxito
            if (onSuccess) {
                onSuccess('Ciclo activado exitosamente', 'success');
            }
        } catch (error) {
            console.error('Error al activar ciclo:', error);
            if (onSuccess) {
                onSuccess(error.response?.data?.detail || 'Error al activar el ciclo', 'error');
            }
        }
    };

    // Formatear fecha para mostrar
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Cerrar modal
    const handleClose = () => {
        setSearchTerm('');
        setShowForm(false);
        setEditingCycle(null);
        setDeletingCycleId(null);
        setShowDeleteConfirm(false);
        setFormData({
            nombre: '',
            fecha_inicio: '',
            fecha_fin: ''
        });
        setFormErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={24} />
                        Gestión de Ciclos Escolares
                    </div>
                }
                size="xl"
            >
                <div className="student-management-content">
                    {!showForm ? (
                        <>
                            {/* Controles superiores */}
                            <div className="management-controls">
                                {/* Búsqueda */}
                                <div className="search-input-group">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre de ciclo..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {/* Botón Agregar */}
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="action-btn primary"
                                    disabled={loading}
                                    style={{ marginLeft: 'auto' }}
                                >
                                    <Plus size={18} />
                                    Agregar Ciclo
                                </button>
                            </div>

                            {/* Tabla de ciclos */}
                            {loading ? (
                                <div className="empty-state">
                                    <Calendar size={64} style={{ color: 'var(--siae-text-tertiary)', opacity: 0.5 }} />
                                    <p>Cargando ciclos escolares...</p>
                                </div>
                            ) : filteredCycles.length > 0 ? (
                                <div className="students-table-wrapper">
                                    <table className="students-table">
                                        <thead>
                                            <tr>
                                                <th>Nombre</th>
                                                <th>Fecha Inicio</th>
                                                <th>Fecha Fin</th>
                                                <th>Estado</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCycles.map(cycle => (
                                                <tr key={cycle.id} className={cycle.activo ? 'active-row' : ''}>
                                                    <td>
                                                        <strong>{cycle.nombre}</strong>
                                                    </td>
                                                    <td>{formatDate(cycle.fecha_inicio)}</td>
                                                    <td>{formatDate(cycle.fecha_fin)}</td>
                                                    <td>
                                                        {cycle.activo ? (
                                                            <span className="badge active">
                                                                <CheckCircle size={14} />
                                                                Activo
                                                            </span>
                                                        ) : (
                                                            <span className="badge inactive">Inactivo</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            {!cycle.activo && (
                                                                <button
                                                                    className="icon-btn success"
                                                                    onClick={() => handleActivate(cycle.id)}
                                                                    title="Activar ciclo"
                                                                >
                                                                    <Power size={16} />
                                                                </button>
                                                            )}
                                                            <button
                                                                className="icon-btn edit"
                                                                onClick={() => handleEdit(cycle)}
                                                                title="Editar ciclo"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                className="icon-btn delete"
                                                                onClick={() => handleDeleteClick(cycle.id)}
                                                                title="Eliminar ciclo"
                                                                disabled={cycle.activo}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <Calendar size={64} style={{ color: 'var(--siae-text-tertiary)', opacity: 0.5 }} />
                                    <h3>
                                        {searchTerm
                                            ? 'No se encontraron ciclos'
                                            : 'No hay ciclos escolares registrados'
                                        }
                                    </h3>
                                    <p>
                                        {searchTerm
                                            ? 'Prueba con un término de búsqueda diferente'
                                            : 'Crea tu primer ciclo escolar para empezar a organizar períodos académicos'
                                        }
                                    </p>
                                    {!searchTerm && (
                                        <button
                                            onClick={() => setShowForm(true)}
                                            className="action-btn primary"
                                            style={{ marginTop: 'var(--siae-spacing-md)' }}
                                        >
                                            <Plus size={18} />
                                            Crear Primer Ciclo
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        /* Formulario para agregar/editar ciclo */
                        <div className="modal-form-container">
                            <form onSubmit={handleSubmit} className="modal-form">
                                {formErrors.submit && (
                                    <div className="form-feedback error">
                                        {formErrors.submit}
                                    </div>
                                )}

                                <div className="form-grid">
                                    <div className="modal-input-group full-width">
                                        <label htmlFor="cycle-nombre">
                                            Nombre del Ciclo *
                                        </label>
                                        <input
                                            type="text"
                                            id="cycle-nombre"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleInputChange}
                                            placeholder="Ej: Agosto-Enero 2025"
                                            className={formErrors.nombre ? 'error' : ''}
                                            disabled={isSubmitting}
                                            maxLength="50"
                                        />
                                        {formErrors.nombre && (
                                            <span className="form-feedback error">{formErrors.nombre}</span>
                                        )}
                                    </div>

                                    <div className="modal-input-group">
                                        <label htmlFor="cycle-fecha-inicio">
                                            Fecha de Inicio *
                                        </label>
                                        <input
                                            type="date"
                                            id="cycle-fecha-inicio"
                                            name="fecha_inicio"
                                            value={formData.fecha_inicio}
                                            onChange={handleInputChange}
                                            className={formErrors.fecha_inicio ? 'error' : ''}
                                            disabled={isSubmitting}
                                        />
                                        {formErrors.fecha_inicio && (
                                            <span className="form-feedback error">{formErrors.fecha_inicio}</span>
                                        )}
                                    </div>

                                    <div className="modal-input-group">
                                        <label htmlFor="cycle-fecha-fin">
                                            Fecha de Fin *
                                        </label>
                                        <input
                                            type="date"
                                            id="cycle-fecha-fin"
                                            name="fecha_fin"
                                            value={formData.fecha_fin}
                                            onChange={handleInputChange}
                                            className={formErrors.fecha_fin ? 'error' : ''}
                                            disabled={isSubmitting}
                                        />
                                        {formErrors.fecha_fin && (
                                            <span className="form-feedback error">{formErrors.fecha_fin}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false);
                                            setEditingCycle(null);
                                            setFormData({
                                                nombre: '',
                                                fecha_inicio: '',
                                                fecha_fin: ''
                                            });
                                            setFormErrors({});
                                        }}
                                        className="modal-btn cancel"
                                        disabled={isSubmitting}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="modal-btn save"
                                        disabled={isSubmitting}
                                    >
                                        {editingCycle ? <Edit size={18} /> : <Plus size={18} />}
                                        {isSubmitting
                                            ? (editingCycle ? 'Actualizando...' : 'Creando...')
                                            : (editingCycle ? 'Actualizar Ciclo' : 'Crear Ciclo')
                                        }
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </Modal >

            {/* Modal de confirmación de eliminación */}
            {
                showDeleteConfirm && (
                    <div className="modal-overlay" style={{ zIndex: 1100 }}>
                        <div className="modal-content confirmation-modal" style={{ maxWidth: '500px' }}>
                            <div className="modal-header">
                                <h2 className="modal-title">
                                    <Trash2 size={24} />
                                    Confirmar Eliminación
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeletingCycleId(null);
                                    }}
                                    className="close-form-btn"
                                    disabled={isSubmitting}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="confirmation-icon">
                                    <Trash2 size={48} />
                                </div>

                                <h3 className="confirmation-title">¿Eliminar ciclo escolar?</h3>

                                <div className="confirmation-message">
                                    ¿Estás seguro de que deseas eliminar este ciclo escolar?
                                    <br /><br />
                                    <strong>Esta acción no se puede deshacer.</strong>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeletingCycleId(null);
                                    }}
                                    className="modal-btn cancel"
                                    disabled={isSubmitting}
                                >
                                    <X size={16} />
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="modal-btn delete"
                                    disabled={isSubmitting}
                                >
                                    <Trash2 size={16} />
                                    {isSubmitting ? 'Eliminando...' : 'Eliminar Ciclo'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default SchoolCyclesManagementModal;
