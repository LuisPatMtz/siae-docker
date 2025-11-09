import React, { useState, useCallback } from 'react';
import Toast from './Toast.jsx';

let toastId = 0;

const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    id={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={removeToast}
                />
            ))}
        </div>
    );
};

// Hook personalizado para manejar las notificaciones
export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const newToast = {
            id: ++toastId,
            message,
            type,
            duration
        };

        setToasts(prevToasts => [...prevToasts, newToast]);
        return newToast.id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    const showSuccess = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
    const showError = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
    const showWarning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
    const showInfo = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

    return {
        toasts,
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        ToastContainer: () => <ToastContainer toasts={toasts} removeToast={removeToast} />
    };
};

export default ToastContainer;