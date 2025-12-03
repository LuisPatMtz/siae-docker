import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const DeleteUserConfirmModal = ({ isOpen, onClose, onConfirm, userName, isDeleting }) => {
    useEscapeKey(isOpen, onClose);
    
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content card small-modal">
                <div className="modal-header form-header">
                    <h2 className="card-title-danger">
                        <Trash2 size={20} /> Confirmar Eliminación
                    </h2>
                    <button onClick={onClose} className="close-form-btn" disabled={isDeleting}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <p>
                        ¿Estás seguro de que deseas eliminar al usuario <strong className="user-highlight">"{userName}"</strong>?
                    </p>
                    <p className="delete-warning">
                        Esta acción no se puede deshacer. Se perderán todos los datos y permisos asociados a este usuario.
                    </p>
                </div>

                <div className="modal-actions form-actions">
                    <button type="button" className="modal-btn cancel" onClick={onClose} disabled={isDeleting}>
                        Cancelar
                    </button>
                    <button type="button" className="modal-btn save" onClick={onConfirm} disabled={isDeleting}>
                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DeleteUserConfirmModal;