// src/components/Students/BulkChangeModal.jsx
import React, { useState, useEffect } from 'react';
import { XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const BulkChangeModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    isProcessing,
    selectedCount,
    changeType, // 'group' o 'semester'
    availableGroups = [],
    availableSemesters = []
}) => {
    const [selectedValue, setSelectedValue] = useState('');
    const [error, setError] = useState('');

    useEscapeKey(onClose, isOpen);

    useEffect(() => {
        if (isOpen) {
            setSelectedValue('');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!selectedValue) {
            setError(`Por favor selecciona un ${changeType === 'group' ? 'grupo' : 'semestre'}`);
            return;
        }

        onConfirm(selectedValue);
    };

    const isGroupChange = changeType === 'group';
    const title = isGroupChange ? 'Cambiar Grupo Masivamente' : 'Cambiar Semestre Masivamente';
    const description = isGroupChange 
        ? `Se cambiará el grupo de ${selectedCount} estudiante(s) seleccionado(s).`
        : `Se cambiará el semestre de ${selectedCount} estudiante(s) seleccionado(s).`;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content bulk-change-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button 
                        className="modal-close-btn" 
                        onClick={onClose}
                        disabled={isProcessing}
                        aria-label="Cerrar modal"
                    >
                        <XCircle size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="info-alert">
                            <AlertCircle size={20} />
                            <p>{description}</p>
                        </div>

                        <div className="modal-input-group">
                            <label htmlFor="bulkChangeValue">
                                {isGroupChange ? 'Seleccionar Nuevo Grupo:' : 'Seleccionar Nuevo Semestre:'}
                            </label>
                            <select
                                id="bulkChangeValue"
                                value={selectedValue}
                                onChange={(e) => {
                                    setSelectedValue(e.target.value);
                                    setError('');
                                }}
                                disabled={isProcessing}
                                required
                            >
                                <option value="">
                                    -- Selecciona una opción --
                                </option>
                                {isGroupChange ? (
                                    availableGroups.map(group => (
                                        <option key={group.id} value={group.id}>
                                            {group.nombre || `Grupo ${group.id}`} ({group.semestre}° Sem - {group.turno})
                                        </option>
                                    ))
                                ) : (
                                    availableSemesters.map(sem => (
                                        <option key={sem} value={sem}>
                                            {sem}° Semestre
                                        </option>
                                    ))
                                )}
                            </select>
                            {error && <p className="error-message">{error}</p>}
                        </div>

                        {isGroupChange && (
                            <div className="warning-alert">
                                <AlertCircle size={18} />
                                <p>
                                    <strong>Nota:</strong> Al cambiar de grupo, también se actualizará el semestre 
                                    del estudiante según el semestre del grupo seleccionado.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="action-button cancel-button"
                            onClick={onClose}
                            disabled={isProcessing}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="action-button save-button"
                            disabled={isProcessing || !selectedValue}
                        >
                            {isProcessing ? (
                                <>
                                    <RefreshCw size={16} className="spin" />
                                    Procesando...
                                </>
                            ) : (
                                `Cambiar ${isGroupChange ? 'Grupo' : 'Semestre'}`
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BulkChangeModal;
