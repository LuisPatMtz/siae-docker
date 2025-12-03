import { X } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    icon: Icon,
    message, 
    highlightText,
    warningMessage,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    isDanger = false,
    isLoading = false,
    children
}) => {
    // Cerrar con ESC
    useEscapeKey(isOpen, onClose);

    if (!isOpen) return null;

    const renderMessage = () => {
        if (children) return children;
        
        if (message && highlightText) {
            const parts = message.split(highlightText);
            return (
                <p>
                    {parts[0]}
                    <strong className="user-highlight">"{highlightText}"</strong>
                    {parts[1]}
                </p>
            );
        }
        
        return message && <p>{message}</p>;
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content card small-modal">
                <div className="modal-header form-header">
                    <h2 className={isDanger ? "card-title-danger" : "card-title"} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {Icon && <Icon size={20} />}
                        {title}
                    </h2>
                    <button onClick={onClose} className="close-form-btn" disabled={isLoading}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    {renderMessage()}
                    {warningMessage && (
                        <p className="delete-warning">{warningMessage}</p>
                    )}
                </div>

                <div className="modal-actions form-actions">
                    <button 
                        type="button" 
                        className="modal-btn cancel" 
                        onClick={onClose} 
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                    <button 
                        type="button" 
                        className="modal-btn save"
                        onClick={onConfirm} 
                        disabled={isLoading}
                    >
                        {isLoading ? 'Procesando...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
