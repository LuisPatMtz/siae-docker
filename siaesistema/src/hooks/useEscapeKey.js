// src/hooks/useEscapeKey.js
import { useEffect } from 'react';

/**
 * Hook personalizado para cerrar modales con la tecla ESC
 * Optimizado para evitar múltiples listeners y mejorar performance
 */
const useEscapeKey = (isOpen, onClose) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        // Prevenir propagación para evitar conflictos
        event.stopPropagation();
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

export { useEscapeKey };