import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import '../../styles/modals/SharedModalStyles.css';

const DeleteCycleModal = ({ isOpen, onClose, onConfirm, isDeleting, cycleData }) => {
    // Hook optimizado para manejar ESC
    useEscapeKey(isOpen, onClose);

    if (!isOpen || !cycleData) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content small cycle-modal confirmation-modal">
                <div className="modal-header">
                    <h2 className="modal-title">
                        <AlertTriangle className="icon" size={24} />
                        Confirmar Eliminación
                    </h2>
                    <button
                        onClick={onClose}
                        className="close-form-btn"
                        disabled={isDeleting}
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="confirmation-icon">
                        <AlertTriangle size={40} />
                    </div>

                    <h3 className="confirmation-title">¿Eliminar ciclo escolar?</h3>

                    <div className="confirmation-message">
                        Estás a punto de eliminar el ciclo escolar{' '}
                        <span className="confirmation-highlight">{cycleData.nombre}</span>
                        {' '}del periodo{' '}
                        <span className="confirmation-highlight">
                            {new Date(cycleData.fecha_inicio).toLocaleDateString('es-ES')} - {' '}
                            {new Date(cycleData.fecha_fin).toLocaleDateString('es-ES')}
                        </span>.
                        <br /><br />
                        <strong>Esta acción no se puede deshacer.</strong>
                    </div>
                </div>

                <div className="modal-actions">
                    <button
                        type="button"
                        onClick={onClose}
                        className="modal-btn cancel"
                        disabled={isDeleting}
                    >
                        <X size={16} />
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="modal-btn delete"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>Eliminando...</>
                        ) : (
                            <>
                                <Trash2 size={16} />
                                Eliminar Ciclo
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteCycleModal;