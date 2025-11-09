import React, { useState, useEffect } from 'react';
import { X, Calendar, Save, AlertCircle, Edit3 } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const EditCycleModal = ({ isOpen, onClose, onSubmit, isEditing, cycleData }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        fecha_inicio: '',
        fecha_fin: ''
    });
    const [errors, setErrors] = useState({});

    // Hook optimizado para manejar ESC
    useEscapeKey(isOpen, onClose);

    useEffect(() => {
        if (cycleData) {
            setFormData({
                nombre: cycleData.nombre || '',
                fecha_inicio: cycleData.fecha_inicio || '',
                fecha_fin: cycleData.fecha_fin || ''
            });
        }
    }, [cycleData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es obligatorio';
        }

        if (!formData.fecha_inicio) {
            newErrors.fecha_inicio = 'La fecha de inicio es obligatoria';
        }

        if (!formData.fecha_fin) {
            newErrors.fecha_fin = 'La fecha de fin es obligatoria';
        }

        if (formData.fecha_inicio && formData.fecha_fin) {
            const fechaInicio = new Date(formData.fecha_inicio);
            const fechaFin = new Date(formData.fecha_fin);
            
            if (fechaFin <= fechaInicio) {
                newErrors.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(cycleData.id, formData);
        }
    };

    const handleClose = () => {
        setErrors({});
        onClose();
    };

    if (!isOpen || !cycleData) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content medium cycle-modal">
                <div className="modal-header">
                    <h2>
                        <Edit3 className="icon cycle-icon" size={24} />
                        Editar Ciclo Escolar
                    </h2>
                    <button 
                        onClick={handleClose} 
                        className="modal-close-btn" 
                        disabled={isEditing}
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <form id="edit-cycle-form" onSubmit={handleSubmit} className="modal-form">
                        <div className="form-group">
                            <label htmlFor="edit-nombre" className="form-label">
                                Nombre del Ciclo <span className="required">*</span>
                            </label>
                            <input
                                id="edit-nombre"
                                name="nombre"
                                type="text"
                                value={formData.nombre}
                                onChange={handleInputChange}
                                placeholder="Ej: Agosto-Enero 2025"
                                disabled={isEditing}
                                className={`form-input ${errors.nombre ? 'invalid' : ''}`}
                            />
                            {errors.nombre && (
                                <div className="error-message">
                                    <AlertCircle size={14} />
                                    {errors.nombre}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                            <div className="form-group">
                                <label htmlFor="edit-fecha_inicio" className="form-label">
                                    <Calendar size={16} />
                                    Fecha de Inicio <span className="required">*</span>
                                </label>
                                <input
                                    id="edit-fecha_inicio"
                                    name="fecha_inicio"
                                    type="date"
                                    value={formData.fecha_inicio}
                                    onChange={handleInputChange}
                                    disabled={isEditing}
                                    className={`form-input ${errors.fecha_inicio ? 'invalid' : ''}`}
                                />
                                {errors.fecha_inicio && (
                                    <div className="error-message">
                                        <AlertCircle size={14} />
                                        {errors.fecha_inicio}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="edit-fecha_fin" className="form-label">
                                    <Calendar size={16} />
                                    Fecha de Fin <span className="required">*</span>
                                </label>
                                <input
                                    id="edit-fecha_fin"
                                    name="fecha_fin"
                                    type="date"
                                    value={formData.fecha_fin}
                                    onChange={handleInputChange}
                                    disabled={isEditing}
                                    className={`form-input ${errors.fecha_fin ? 'invalid' : ''}`}
                                />
                                {errors.fecha_fin && (
                                    <div className="error-message">
                                        <AlertCircle size={14} />
                                        {errors.fecha_fin}
                                    </div>
                                )}
                            </div>
                        </div>

                    </form>
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="modal-btn modal-btn-secondary"
                        disabled={isEditing}
                    >
                        <X size={16} />
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className={`modal-btn modal-btn-primary ${isEditing ? 'loading' : ''}`}
                        disabled={isEditing}
                    >
                        {isEditing ? (
                            <>Guardando...</>
                        ) : (
                            <>
                                <Save size={16} />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditCycleModal;