import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/UI/Toast.jsx';

let toastId = 0;

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
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

    return (
        <ToastContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
            {children}
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
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast debe usarse dentro de ToastProvider');
    }
    return context;
};
