// src/components/Alerts/JustifyModal.jsx
import React, { useState, useEffect } from 'react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const JustifyModal = ({ isOpen, onClose, studentName, onSubmit }) => {
  // Hook optimizado para manejar ESC
  useEscapeKey(isOpen, onClose);
  
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Limpiar el campo de razón cuando el modal se abre/cierra
  useEffect(() => {
    if (isOpen) {
      setReason(''); // Resetea al abrir
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setIsSaving(true);
    // Llama a la función onSubmit pasada desde AlertasPage
    await onSubmit(reason); 
    setIsSaving(false);
    // onClose(); // onSubmit ya debería cerrar el modal
  };

  // No renderizar nada si no está abierto
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}> {/* Cierra al hacer clic fuera */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Evita que el clic dentro cierre */}
        <h2 className="modal-title">Justificar Faltas</h2>
        <p className="modal-student-name">Estudiante: <strong>{studentName}</strong></p>
        
        <div className="modal-input-group">
          <label htmlFor="justificationReason">Motivo de la Justificación:</label>
          <textarea
            id="justificationReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe brevemente el motivo..."
            rows={4}
          />
        </div>

        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onClose} disabled={isSaving}>
            Cancelar
          </button>
          <button 
            className="modal-btn save" 
            onClick={handleSubmit} 
            disabled={!reason || isSaving} // Deshabilita si no hay razón o está guardando
          >
            {isSaving ? 'Guardando...' : 'Guardar Justificación'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JustifyModal;