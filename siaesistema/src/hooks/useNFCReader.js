// src/hooks/useNFCReader.js
import { useState, useEffect, useRef } from 'react';

/**
 * Hook personalizado para detectar y leer tarjetas NFC usando Web NFC API
 * y lectores USB compatibles con teclado (keyboard emulation)
 */
export const useNFCReader = (isActive = false) => {
  const [nfcData, setNfcData] = useState('');
  const [isReaderConnected, setIsReaderConnected] = useState(false);
  const [error, setError] = useState(null);
  const [readerType, setReaderType] = useState(null); // 'webnfc', 'keyboard', 'manual'
  const bufferRef = useRef('');
  const timeoutRef = useRef(null);

  // Detectar Web NFC API (principalmente en Android Chrome)
  useEffect(() => {
    if (!isActive) return;

    const checkWebNFC = async () => {
      if ('NDEFReader' in window) {
        try {
          const ndef = new window.NDEFReader();
          await ndef.scan();
          
          setIsReaderConnected(true);
          setReaderType('webnfc');
          
          ndef.addEventListener('reading', ({ serialNumber }) => {
            // El serialNumber es el UID de la tarjeta NFC
            const nfcUID = serialNumber.replace(/:/g, '').toUpperCase();
            setNfcData(nfcUID);
          });

          ndef.addEventListener('readingerror', () => {
            setError('Error al leer la tarjeta NFC');
          });

          return () => {
            ndef.removeEventListener('reading');
            ndef.removeEventListener('readingerror');
          };
        } catch (err) {
          console.log('Web NFC no disponible o sin permisos:', err);
          setReaderType('keyboard');
        }
      } else {
        setReaderType('keyboard');
      }
    };

    checkWebNFC();
  }, [isActive]);

  // Detectar lectores USB que emulan teclado
  useEffect(() => {
    if (!isActive || readerType === 'webnfc') return;

    const handleKeyPress = (e) => {
      // Ignorar teclas de modificación
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Enter indica fin de lectura
      if (e.key === 'Enter' && bufferRef.current.length > 0) {
        e.preventDefault();
        const cleanData = bufferRef.current.trim().toUpperCase();
        
        // Validar que parece un UID NFC (alfanumérico, típicamente 8-20 caracteres)
        if (/^[0-9A-F]{8,20}$/i.test(cleanData)) {
          setNfcData(cleanData);
          setIsReaderConnected(true);
          setReaderType('keyboard');
        }
        
        bufferRef.current = '';
        clearTimeout(timeoutRef.current);
        return;
      }

      // Acumular caracteres alfanuméricos
      if (/^[a-zA-Z0-9]$/.test(e.key)) {
        e.preventDefault();
        bufferRef.current += e.key;
        
        // Reset timeout - si pasa más de 100ms sin teclas, limpiar buffer
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = '';
        }, 100);
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    
    return () => {
      document.removeEventListener('keypress', handleKeyPress);
      clearTimeout(timeoutRef.current);
    };
  }, [isActive, readerType]);

  // Función para limpiar el estado
  const clearNfcData = () => {
    setNfcData('');
    bufferRef.current = '';
  };

  // Función para establecer modo manual
  const setManualMode = () => {
    setReaderType('manual');
  };

  return {
    nfcData,
    isReaderConnected,
    readerType,
    error,
    clearNfcData,
    setManualMode
  };
};
