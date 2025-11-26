// src/components/Alerts/JustifyModal.jsx
import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

const JustifyModal = ({ isOpen, onClose, studentName, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(reason);
      setReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '600px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '2rem 2rem 1.5rem',
          borderBottom: '2px solid #e5e7eb',
          background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
          borderRadius: '16px 16px 0 0',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <AlertCircle size={28} />
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'white',
                letterSpacing: '-0.02em'
              }}>
                Justificar Faltas
              </h2>
              <p style={{
                margin: '0.25rem 0 0',
                fontSize: '0.9375rem',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 500
              }}>
                Estudiante: {studentName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.75rem',
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: '#1f2937',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Motivo de la Justificación
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe brevemente el motivo de la justificación..."
              required
              rows={5}
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '0.9375rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                transition: 'all 0.2s ease',
                background: '#f9fafb'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.background = '#ffffff';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.background = '#f9fafb';
                e.target.style.boxShadow = 'none';
              }}
            />
            <p style={{
              marginTop: '0.75rem',
              fontSize: '0.875rem',
              color: '#6b7280',
              fontStyle: 'italic'
            }}>
              💡 Proporciona una explicación clara y detallada para el registro
            </p>
          </div>

          {/* Footer */}
          <div style={{
            padding: '1.5rem 2rem',
            borderTop: '2px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            background: '#f9fafb',
            borderRadius: '0 0 16px 16px'
          }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 1.5rem',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: 'white',
                color: '#6b7280',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.background = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.background = 'white';
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || isSubmitting}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: !reason.trim() || isSubmitting ? 'not-allowed' : 'pointer',
                background: !reason.trim() || isSubmitting
                  ? '#d1d5db'
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: !reason.trim() || isSubmitting
                  ? 'none'
                  : '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (reason.trim() && !isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = reason.trim() && !isSubmitting
                  ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                  : 'none';
              }}
            >
              <CheckCircle size={18} />
              {isSubmitting ? 'Guardando...' : 'Guardar Justificación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JustifyModal;