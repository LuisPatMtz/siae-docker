// src/components/Students/LinkNfcModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link2, CheckCircle } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const LinkNfcModal = ({ isOpen, onClose, onSubmit, studentName, isSaving }) => {
    // Hook optimizado para manejar ESC
    useEscapeKey(isOpen, onClose);
    
    const [nfcId, setNfcId] = useState('');
    const [error, setError] = useState('');
    const [readingsCount, setReadingsCount] = useState(0); // Contador de lecturas
    const [isVerifying, setIsVerifying] = useState(false); // Estado de verificación
    const inputFieldRef = useRef(null);
    const readingsRef = useRef([]); // Almacenar las 3 lecturas
    const verificationTimeoutRef = useRef(null);
    const inputTimeoutRef = useRef(null); // Para detectar pausas entre escrituras

    // Limpiar campo al abrir/cerrar y mantener foco
    useEffect(() => {
        if (isOpen) {
            setNfcId('');
            setError('');
            setReadingsCount(0);
            setIsVerifying(false);
            readingsRef.current = [];
            if (verificationTimeoutRef.current) {
                clearTimeout(verificationTimeoutRef.current);
            }
            if (inputTimeoutRef.current) {
                clearTimeout(inputTimeoutRef.current);
            }
            // Enfocar el input inmediatamente
            setTimeout(() => {
                if (inputFieldRef.current) {
                    inputFieldRef.current.focus();
                }
            }, 50);
        }
        return () => {
            if (verificationTimeoutRef.current) {
                clearTimeout(verificationTimeoutRef.current);
            }
            if (inputTimeoutRef.current) {
                clearTimeout(inputTimeoutRef.current);
            }
        };
    }, [isOpen]);

    // Mantener el foco en el input mientras el modal está abierto
    useEffect(() => {
        if (!isOpen) return;

        const intervalId = setInterval(() => {
            // Solo mantener foco si no hemos completado las 3 lecturas
            if (inputFieldRef.current && readingsCount < 3 && !isSaving) {
                if (document.activeElement !== inputFieldRef.current) {
                    inputFieldRef.current.focus();
                }
            }
        }, 100);

        return () => clearInterval(intervalId);
    }, [isOpen, readingsCount, isSaving]);

    // Función para validar formato UID (8 caracteres hexadecimales)
    const isValidUID = (uid) => {
        return /^[0-9A-F]{8}$/.test(uid);
    };

    // Función para procesar una nueva lectura
    const processReading = (newUID) => {
        const cleanUID = newUID.trim().toUpperCase();
        
        if (!isValidUID(cleanUID)) {
            setError('Formato inválido. Debe ser 8 caracteres hexadecimales (ej: 29115803)');
            return;
        }

        // Agregar lectura al array
        readingsRef.current.push(cleanUID);
        const currentCount = readingsRef.current.length;
        setReadingsCount(currentCount);

        if (currentCount === 1) {
            setIsVerifying(true);
            setError('');
            setNfcId(cleanUID); // Mostrar primer UID leído
        } else if (currentCount === 2) {
            // Segunda lectura - solo actualizar contador
            setError('');
        } else if (currentCount === 3) {
            // Tercera lectura - verificar consenso inmediatamente
            verificationTimeoutRef.current = setTimeout(() => {
                verifyReadings();
            }, 100);
        }
    };

    // Función para verificar consenso de las 3 lecturas
    const verifyReadings = () => {
        const [reading1, reading2, reading3] = readingsRef.current;

        // Verificar si las 3 lecturas son idénticas
        if (reading1 === reading2 && reading2 === reading3) {
            // ✓ Consenso alcanzado
            setNfcId(reading1);
            setError('');
            setIsVerifying(false);
            // Auto-submit inmediato después de verificación exitosa
            setTimeout(() => {
                if (reading1) {
                    onSubmit(reading1);
                }
            }, 200);
        } else {
            // ✗ Lecturas inconsistentes
            setError(`Lecturas inconsistentes. Por favor, vuelva a escanear la tarjeta.`);
            setNfcId('');
            setReadingsCount(0);
            setIsVerifying(false);
            readingsRef.current = [];
            // Re-enfocar el input
            setTimeout(() => {
                if (inputFieldRef.current) {
                    inputFieldRef.current.focus();
                }
            }, 100);
        }
    };

    const handleInputChange = (e) => {
        // Si ya tenemos 3 lecturas, ignorar más entrada
        if (readingsCount >= 3) {
            e.target.value = '';
            return;
        }
        
        const value = e.target.value.toUpperCase();
        
        // Limpiar timeout previo
        if (inputTimeoutRef.current) {
            clearTimeout(inputTimeoutRef.current);
        }
        
        // Esperar 100ms sin nuevas teclas para considerar que terminó de escribir
        inputTimeoutRef.current = setTimeout(() => {
            // Verificar de nuevo que no hayamos alcanzado 3 lecturas
            if (readingsRef.current.length >= 3) {
                if (inputFieldRef.current) {
                    inputFieldRef.current.value = '';
                }
                return;
            }
            
            if (value.length >= 8) {
                // Tomar los primeros 8 caracteres válidos
                const uid = value.substring(0, 8);
                
                if (isValidUID(uid)) {
                    processReading(uid);
                } else {
                    setError('Formato inválido detectado. Por favor, vuelva a escanear.');
                }
                
                // Limpiar el input inmediatamente para la siguiente lectura
                if (inputFieldRef.current) {
                    inputFieldRef.current.value = '';
                }
            }
        }, 100);
    };

    // Función removida - el submit es completamente automático después de 3 lecturas

    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content link-nfc-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Vincular Tarjeta NFC</h2>
                
                <div className="modal-student-info">
                    <p className="modal-student-name">Estudiante: <strong>{studentName}</strong></p>
                    <p className="modal-instruction">Acerque la tarjeta NFC al lector...</p>
                </div>

                {error && <div className="form-error">{error}</div>}
                
                <div className="nfc-capture-area">
                    <input
                        ref={inputFieldRef}
                        type="text"
                        id="nfcIdInput"
                        onChange={handleInputChange}
                        autoFocus
                        autoComplete="off"
                        disabled={isSaving || readingsCount >= 3}
                        maxLength={8}
                        className="nfc-hidden-input"
                        placeholder="Lector NFC activo..."
                    />
                    
                    {isSaving ? (
                        <div className="nfc-preview success">
                            <div className="nfc-icon">💾</div>
                            <span>Guardando vínculo...</span>
                        </div>
                    ) : nfcId && readingsCount === 3 ? (
                        <div className="nfc-preview success">
                            <CheckCircle size={32} />
                            <span>ID capturado: {nfcId}</span>
                        </div>
                    ) : (
                        <div className="nfc-waiting">
                            <div className="nfc-icon">📡</div>
                            <span>Esperando lectura del lector NFC...</span>
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <button type="button" className="modal-btn cancel" onClick={onClose} disabled={isSaving}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LinkNfcModal;