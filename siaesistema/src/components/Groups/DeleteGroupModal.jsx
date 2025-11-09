// src/components/Groups/DeleteGroupModal.jsx
import React from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const DeleteGroupModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    isDeleting, 
    groupData 
}) => {
    // Hook optimizado para manejar ESC
    useEscapeKey(isOpen, onClose);
    if (!isOpen) return null;

    const handleClose = () => {
        if (!isDeleting) {
            onClose();
        }
    };

    const handleConfirm = () => {
        onConfirm();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content small group-modal confirmation-modal">
                <div className="modal-header">
                    <h2>
                        <AlertTriangle className="icon" size={24} />
                        Confirmar Eliminación
                    </h2>
                    <button 
                        onClick={handleClose} 
                        className="modal-close-btn"
                        disabled={isDeleting}
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="confirmation-icon">
                        <Trash2 size={40} />
                    </div>
                    
                    <h3 className="confirmation-title">¿Eliminar grupo?</h3>
                    
                    <div className="confirmation-message">
                        Estás a punto de eliminar el grupo{' '}
                        <span className="confirmation-highlight">{groupData?.nombre}</span>
                        {' '}del turno{' '}
                        <span className="confirmation-highlight">{groupData?.turno}</span>
                        {' '}({groupData?.semestre}° semestre).
                        
                        <br /><br />
                        <strong>Esta acción no se puede deshacer.</strong>
                        {' '}Si el grupo tiene estudiantes asignados, no podrá ser eliminado.
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="modal-btn modal-btn-secondary"
                        disabled={isDeleting}
                    >
                        <X size={16} />
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className={`modal-btn modal-btn-danger ${isDeleting ? 'loading' : ''}`}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>Eliminando...</>
                        ) : (
                            <>
                                <Trash2 size={16} />
                                Eliminar Grupo
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteGroupModal;