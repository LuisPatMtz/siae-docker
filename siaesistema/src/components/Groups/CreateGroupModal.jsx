// src/components/Groups/CreateGroupModal.jsx
import React, { useState } from 'react';
import { X, PlusCircle, AlertCircle, CheckCircle, Users, Plus } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const CreateGroupModal = ({ isOpen, onClose, onSubmit, isCreating = false }) => {
    // Hook optimizado para manejar ESC
    useEscapeKey(isOpen, onClose);
    
    // Estados para el formulario
    const [groupName, setGroupName] = useState('');
    const [groupTurno, setGroupTurno] = useState('Matutino');
    const [groupSemestre, setGroupSemestre] = useState(1);
    const [error, setError] = useState('');

    const clearForm = () => {
        setGroupName('');
        setGroupTurno('Matutino');
        setGroupSemestre(1);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Validaciones
        if (!groupName.trim()) {
            setError('El nombre del grupo es obligatorio.');
            return;
        }
        
        if (groupName.trim().length < 2) {
            setError('El nombre del grupo debe tener al menos 2 caracteres.');
            return;
        }
        
        if (groupName.trim().length > 20) {
            setError('El nombre del grupo no puede tener más de 20 caracteres.');
            return;
        }

        const groupData = {
            nombre: groupName.trim(),
            turno: groupTurno,
            semestre: groupSemestre
        };

        try {
            await onSubmit(groupData);
            // Si tiene éxito, cierra el modal y limpia
            clearForm();
            onClose();
        } catch (apiError) {
            // Si onSubmit lanza un error (de la API), lo mostramos
            setError(apiError.message || "Error al crear el grupo.");
        }
    };

    const handleClose = () => {
        clearForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content medium group-modal">
                <div className="modal-header">
                    <h2>
                        <Users className="icon group-icon" size={24} />
                        Crear Nuevo Grupo
                    </h2>
                    <button 
                        onClick={handleClose} 
                        className="modal-close-btn" 
                        disabled={isCreating}
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="modal-body">
                    <form id="create-group-form" onSubmit={handleSubmit} className="modal-form">
                        {error && (
                            <div className="error-message">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}
                        
                        <div className="form-group">
                            <label htmlFor="modalGroupName" className="form-label">
                                <Users size={16} />
                                Nombre del Grupo <span className="required">*</span>
                            </label>
                            <input 
                                type="text" 
                                id="modalGroupName" 
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Ej: 101, 305, 507, A1, B2"
                                required
                                disabled={isCreating}
                                className="form-input"
                                maxLength={20}
                                minLength={2}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                            <div className="form-group">
                                <label htmlFor="modalGroupTurno" className="form-label">
                                    Turno <span className="required">*</span>
                                </label>
                                <select 
                                    id="modalGroupTurno" 
                                    value={groupTurno}
                                    onChange={(e) => setGroupTurno(e.target.value)}
                                    disabled={isCreating}
                                    className="form-select"
                                >
                                    <option value="Matutino">Matutino</option>
                                    <option value="Vespertino">Vespertino</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="modalGroupSemestre" className="form-label">
                                    Semestre <span className="required">*</span>
                                </label>
                                <select 
                                    id="modalGroupSemestre" 
                                    value={groupSemestre}
                                    onChange={(e) => setGroupSemestre(parseInt(e.target.value))}
                                    disabled={isCreating}
                                    className="form-select"
                                >
                                    <option value={1}>1° Semestre</option>
                                    <option value={2}>2° Semestre</option>
                                    <option value={3}>3° Semestre</option>
                                    <option value={4}>4° Semestre</option>
                                    <option value={5}>5° Semestre</option>
                                    <option value={6}>6° Semestre</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>
                
                <div className="modal-footer">
                    <button 
                        type="button" 
                        className="modal-btn modal-btn-secondary" 
                        onClick={handleClose} 
                        disabled={isCreating}
                    >
                        <X size={16} />
                        Cancelar
                    </button>
                    <button 
                        type="button"
                        onClick={handleSubmit} 
                        className={`modal-btn modal-btn-primary ${isCreating ? 'loading' : ''}`}
                        disabled={isCreating}
                    >
                        {isCreating ? (
                            <>Creando...</>
                        ) : (
                            <>
                                <Plus size={16} />
                                Crear Grupo
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;