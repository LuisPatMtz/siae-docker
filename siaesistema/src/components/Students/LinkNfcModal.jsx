// src/components/Students/LinkNfcModal.jsx
import React, { useState, useEffect } from 'react';
import { Link2 } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const LinkNfcModal = ({ isOpen, onClose, onSubmit, studentName, isSaving }) => {
    // Hook optimizado para manejar ESC
    useEscapeKey(isOpen, onClose);
    
    const [nfcId, setNfcId] = useState('');
    const [error, setError] = useState('');

    // Limpiar campo al abrir/cerrar
    useEffect(() => {
        if (isOpen) {
            setNfcId('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!nfcId.trim()) {
            setError('El ID NFC no puede estar vacío.');
            return;
        }
        setError('');
        onSubmit(nfcId.trim()); // Llama al interruptor de AlertasPage
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content link-nfc-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Vincular NFC</h2>
                <p className="modal-student-name">Estudiante: <strong>{studentName}</strong></p>

                <form onSubmit={handleSubmit}>
                    {error && <div className="form-error">{error}</div>}
                    <div className="modal-input-group">
                        <label htmlFor="nfcIdInput">ID Tarjeta/Tag NFC:</label>
                        <input
                            type="text"
                            id="nfcIdInput"
                            value={nfcId}
                            onChange={(e) => setNfcId(e.target.value)}
                            placeholder="Acerque la tarjeta al lector..."
                            required
                            autoFocus // Pone el foco aquí al abrir
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="modal-btn cancel" onClick={onClose} disabled={isSaving}>
                            Cerrar
                        </button>
                        <button type="submit" className="modal-btn save" disabled={isSaving || !nfcId}>
                            <Link2 size={16} />
                            {isSaving ? 'Guardando...' : 'Guardar Vínculo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LinkNfcModal;