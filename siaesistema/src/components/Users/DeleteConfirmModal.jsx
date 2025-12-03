import React from 'react';
// --- 1. Importa los iconos ---
import { X, Trash2, AlertCircle } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

// --- 2. Acepta 'isSaving' para deshabilitar botones ---
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, userName, isSaving }) => {
    useEscapeKey(isOpen, onClose);
    
    if (!isOpen) {
        return null;
    }

    return (
        // --- 3. Clases de estilo mejoradas (basadas en tus otros modales) ---
        <div className="modal-overlay">
            <div className="modal-content card small-modal">
                <div className="modal-header form-header">
                    <h2 className="card-title-danger">
                        <AlertCircle size={20} />
                        Confirmar Eliminación
                    </h2>
                    {/* --- 4. Botón deshabilitado si 'isSaving' es true --- */}
                    <button onClick={onClose} className="close-form-btn" disabled={isSaving}>
                        <X size={24} />
                    </button>
                </div>
                
                <div className="modal-body">
                    <p>
                        ¿Estás seguro de que deseas eliminar permanentemente este registro?
                    </p>
                    <p className="delete-user-name">
                        <strong>{userName || 'seleccionado'}</strong>
                    </p>
                    <p className="delete-warning">
                        Esta acción no se puede deshacer.
                    </p>
                </div>
                
                <div className="modal-actions form-actions">
                    <button type="button" className="action-button clear-button" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </button>
                    <button 
                        type="button" 
                        className="action-button delete-button" 
                        onClick={onConfirm} 
                        disabled={isSaving}
                    >
                        <Trash2 size={18} />
                        {isSaving ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;