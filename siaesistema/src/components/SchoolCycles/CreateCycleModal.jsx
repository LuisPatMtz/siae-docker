import React, { useState } from 'react';
import { X, Calendar, AlertCircle, Plus } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import '../../styles/modals/SharedModalStyles.css';

const CreateCycleModal = ({ isOpen, onClose, onSubmit, isCreating }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        fecha_inicio: '',
        fecha_fin: ''
    });
    const [errors, setErrors] = useState({});

    // Funcionalidad ESC optimizada
    useEscapeKey(isOpen, onClose);

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
            // Siempre crear con activo: false
            onSubmit({ ...formData, activo: false });
        }
    };

    const handleClose = () => {
        setFormData({
            nombre: '',
            fecha_inicio: '',
            fecha_fin: ''
        });
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content max-w-lg">
                <div className="modal-header">
                    <h2 className="modal-title">
                        <Calendar size={20} />
                        Crear Nuevo Ciclo Escolar
                    </h2>
                    <button
                        onClick={handleClose}
                        className="close-form-btn"
                        disabled={isCreating}
                        type="button"
                        aria-label="Cerrar modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <form id="cycle-form" onSubmit={handleSubmit} className="modal-form">
                        <div className="modal-input-group">
                            <label htmlFor="nombre">
                                Nombre del Ciclo <span style={{ color: 'var(--siae-error)' }}>*</span>
                            </label>
                            <input
                                id="nombre"
                                name="nombre"
                                type="text"
                                value={formData.nombre}
                                onChange={handleInputChange}
                                placeholder="Ej: Agosto-Enero 2025"
                                disabled={isCreating}
                            />
                            {errors.nombre && (
                                <div className="form-feedback error">
                                    <AlertCircle size={16} />
                                    {errors.nombre}
                                </div>
                            )}
                        </div>

                        <div className="form-grid-col-2">
                            <div className="modal-input-group">
                                <label htmlFor="fecha_inicio">
                                    Fecha de Inicio <span style={{ color: 'var(--siae-error)' }}>*</span>
                                </label>
                                <input
                                    id="fecha_inicio"
                                    name="fecha_inicio"
                                    type="date"
                                    value={formData.fecha_inicio}
                                    onChange={handleInputChange}
                                    disabled={isCreating}
                                />
                                {errors.fecha_inicio && (
                                    <div className="form-feedback error">
                                        <AlertCircle size={16} />
                                        {errors.fecha_inicio}
                                    </div>
                                )}
                            </div>

                            <div className="modal-input-group">
                                <label htmlFor="fecha_fin">
                                    Fecha de Fin <span style={{ color: 'var(--siae-error)' }}>*</span>
                                </label>
                                <input
                                    id="fecha_fin"
                                    name="fecha_fin"
                                    type="date"
                                    value={formData.fecha_fin}
                                    onChange={handleInputChange}
                                    disabled={isCreating}
                                />
                                {errors.fecha_fin && (
                                    <div className="form-feedback error">
                                        <AlertCircle size={16} />
                                        {errors.fecha_fin}
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                <div className="modal-actions">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="modal-btn cancel"
                        disabled={isCreating}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="cycle-form"
                        className="modal-btn save"
                        disabled={isCreating}
                    >
                        {isCreating ? (
                            <>Creando...</>
                        ) : (
                            <>
                                <Plus size={18} />
                                Crear Ciclo
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateCycleModal;