import { useState } from 'react';
import { Trash2, X } from 'lucide-react';

const DeleteUserConfirmModal = ({ isOpen, onClose, onConfirm, userName, isDeleting }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleBackdropClick}>
            <div className="modal-content delete-confirmation-modal">
                <div className="modal-header">
                    <div className="modal-title-container">
                        <div className="modal-icon delete-icon">
                            <Trash2 size={20} />
                        </div>
                        <h2 className="modal-title">Confirmar Eliminación</h2>
                    </div>
                    <button 
                        className="close-button"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="delete-warning">
                        <p className="warning-text">
                            ¿Estás seguro de que deseas eliminar al usuario{' '}
                            <strong className="user-highlight">"{userName}"</strong>?
                        </p>
                        <p className="warning-subtext">
                            Esta acción no se puede deshacer. Se perderán todos los datos 
                            y permisos asociados a este usuario.
                        </p>
                    </div>
                </div>

                <div className="modal-actions">
                    <button 
                        className="button secondary"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancelar
                    </button>
                    <button 
                        className="button danger"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <div className="spinner"></div>
                                Eliminando...
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} />
                                Eliminar Usuario
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteUserConfirmModal;