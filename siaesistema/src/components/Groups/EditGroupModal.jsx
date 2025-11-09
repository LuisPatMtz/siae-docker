// src/components/Groups/EditGroupModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Edit3, AlertCircle, CheckCircle, Save } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const EditGroupModal = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    isLoading, 
    groupData // Los datos del grupo a editar
}) => {
    // Hook optimizado para manejar ESC
    useEscapeKey(isOpen, onClose);
    
    const [formData, setFormData] = useState({
        nombre: '',
        turno: 'Matutino',
        semestre: '1'
    });
    const [errors, setErrors] = useState({});
    const [feedback, setFeedback] = useState({ message: '', type: '' });

    // Llenar el formulario con los datos del grupo cuando se abre el modal
    useEffect(() => {
        if (isOpen && groupData) {
            setFormData({
                nombre: groupData.nombre || '',
                turno: groupData.turno || 'Matutino',
                semestre: groupData.semestre?.toString() || '1'
            });
            setErrors({});
            setFeedback({ message: '', type: '' });
        }
    }, [isOpen, groupData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Limpiar error específico cuando el usuario empiece a escribir
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Validar nombre del grupo
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre del grupo es obligatorio';
        } else if (formData.nombre.trim().length < 2) {
            newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
        } else if (formData.nombre.trim().length > 10) {
            newErrors.nombre = 'El nombre no puede exceder 10 caracteres';
        }

        // Validar turno
        if (!['Matutino', 'Vespertino'].includes(formData.turno)) {
            newErrors.turno = 'Turno inválido';
        }

        // Validar semestre
        const semestre = parseInt(formData.semestre);
        if (isNaN(semestre) || semestre < 1 || semestre > 9) {
            newErrors.semestre = 'El semestre debe ser entre 1 y 9';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            await onSubmit({
                nombre: formData.nombre.trim(),
                turno: formData.turno,
                semestre: parseInt(formData.semestre)
            });
            
            setFeedback({ 
                message: '¡Grupo actualizado exitosamente!', 
                type: 'success' 
            });
            
            // Cerrar modal después de un breve delay para mostrar el feedback
            setTimeout(() => {
                onClose();
            }, 1500);
            
        } catch (error) {
            setFeedback({ 
                message: error.message || 'Error al actualizar el grupo', 
                type: 'error' 
            });
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setFeedback({ message: '', type: '' });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content medium group-modal">
                <div className="modal-header">
                    <h2>
                        <Edit3 className="icon group-icon" size={24} />
                        Editar Grupo
                    </h2>
                    <button 
                        onClick={handleClose} 
                        className="modal-close-btn"
                        disabled={isLoading}
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <form id="edit-group-form" onSubmit={handleSubmit} className="modal-form">
                        {feedback.message && (
                            <div className={`error-message ${feedback.type === 'success' ? 'success' : ''}`}>
                                {feedback.type === 'success' ? 
                                    <CheckCircle size={14} /> : 
                                    <AlertCircle size={14} />
                                }
                                {feedback.message}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="edit-nombre" className="form-label">
                                <Edit3 size={16} />
                                Nombre del Grupo <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="edit-nombre"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleInputChange}
                                className={`form-input ${errors.nombre ? 'invalid' : ''}`}
                                placeholder="Ej: 101, 102, 501"
                                maxLength="10"
                                disabled={isLoading}
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
                                <label htmlFor="edit-turno" className="form-label">
                                    Turno <span className="required">*</span>
                                </label>
                                <select
                                    id="edit-turno"
                                    name="turno"
                                    value={formData.turno}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                    className={`form-select ${errors.turno ? 'invalid' : ''}`}
                                >
                                    <option value="Matutino">Matutino</option>
                                    <option value="Vespertino">Vespertino</option>
                                </select>
                                {errors.turno && (
                                    <div className="error-message">
                                        <AlertCircle size={14} />
                                        {errors.turno}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="edit-semestre" className="form-label">
                                    Semestre <span className="required">*</span>
                                </label>
                                <select
                                    id="edit-semestre"
                                    name="semestre"
                                    value={formData.semestre}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                    className={`form-select ${errors.semestre ? 'invalid' : ''}`}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(sem => (
                                        <option key={sem} value={sem.toString()}>
                                            {sem}° Semestre
                                        </option>
                                    ))}
                                </select>
                                {errors.semestre && (
                                    <div className="error-message">
                                        <AlertCircle size={14} />
                                        {errors.semestre}
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
                        disabled={isLoading}
                    >
                        <X size={16} />
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="edit-group-form"
                        className={`modal-btn modal-btn-primary ${isLoading ? 'loading' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>Actualizando...</>
                        ) : (
                            <>
                                <Save size={16} />
                                Actualizar Grupo
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditGroupModal;