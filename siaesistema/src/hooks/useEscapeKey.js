// src/hooks/useEscapeKey.js
import { useEffect } from 'react';

/**
 * Hook personalizado para cerrar modales con la tecla ESC
 * Optimizado para evitar múltiples listeners y mejorar performance
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {Function} onClose - Función para cerrar el modal
 */
const useEscapeKey = (isOpen, onClose) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen && onClose) {
        // Prevenir propagación para evitar conflictos
        event.stopPropagation();
        event.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      // Usar capture para garantizar que se ejecute primero
      document.addEventListener('keydown', handleKeyDown, { capture: true });
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [isOpen, onClose]);
};

export default useEscapeKey;
export { useEscapeKey };