import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'info', duration = 5000, onClose, id }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Animación de entrada
        const enterTimer = setTimeout(() => {
            setIsVisible(true);
        }, 100);

        // Auto-cerrar después de la duración
        const exitTimer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => {
            clearTimeout(enterTimer);
            clearTimeout(exitTimer);
        };
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose(id);
        }, 300); // Tiempo de animación de salida
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} />;
            case 'error':
                return <AlertCircle size={20} />;
            case 'warning':
                return <AlertTriangle size={20} />;
            default:
                return <Info size={20} />;
        }
    };

    const getTypeClass = () => {
        switch (type) {
            case 'success':
                return 'toast-success';
            case 'error':
                return 'toast-error';
            case 'warning':
                return 'toast-warning';
            default:
                return 'toast-info';
        }
    };

    return (
        <div 
            className={`toast ${getTypeClass()} ${isVisible ? 'toast-visible' : ''} ${isExiting ? 'toast-exiting' : ''}`}
        >
            <div className="toast-content">
                <div className="toast-icon">
                    {getIcon()}
                </div>
                <div className="toast-message">
                    {message}
                </div>
                <button 
                    className="toast-close"
                    onClick={handleClose}
                    aria-label="Cerrar notificación"
                >
                    <X size={16} />
                </button>
            </div>
            <div className="toast-progress">
                <div className="toast-progress-bar"></div>
            </div>
        </div>
    );
};

export default Toast;