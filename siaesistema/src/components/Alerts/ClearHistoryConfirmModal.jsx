// src/components/Alerts/ClearHistoryConfirmModal.jsx
import React from 'react';

const ClearHistoryConfirmModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay confirm-overlay" onClick={onClose}> {/* Overlay diferente para posible estilo */}
            <div className="modal-content confirm-modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title confirm-title">Confirmar Acción</h2>
                <p className="confirm-message">
                    ¿Estás seguro de que deseas borrar todo el historial de justificaciones para este turno? Esta acción no se puede deshacer.
                </p>
                <div className="modal-actions confirm-actions">
                    <button className="modal-btn cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="modal-btn delete" onClick={onConfirm}> {/* Botón de confirmación */}
                        Sí, Borrar Historial
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClearHistoryConfirmModal;