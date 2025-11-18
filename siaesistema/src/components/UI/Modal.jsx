// src/components/UI/Modal.jsx
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

/**
 * Componente Modal reutilizable
 * @param {boolean} isOpen - Controla si el modal está visible
 * @param {Function} onClose - Callback para cerrar el modal
 * @param {string} title - Título del modal
 * @param {ReactNode} children - Contenido del modal
 * @param {string} size - Tamaño del modal: 'sm' | 'md' | 'lg' | 'xl'
 * @param {boolean} showCloseButton - Mostrar botón X de cierre
 */
const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true
}) => {
    // Cerrar con tecla Escape
    useEscapeKey(isOpen, onClose);

    // Prevenir scroll del body cuando el modal está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-3xl',
        xl: 'max-w-6xl'
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                className={`modal-content ${sizeClasses[size]}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    {showCloseButton && (
                        <button
                            type="button"
                            className="close-form-btn"
                            onClick={onClose}
                            aria-label="Cerrar modal"
                        >
                            <X size={24} />
                        </button>
                    )}
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

Modal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
    showCloseButton: PropTypes.bool
};

export default Modal;
