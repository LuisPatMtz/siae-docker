// src/components/Alerts/JustificationHistoryModal.jsx
import React, { useState } from 'react';
import { X, Calendar, User, FileText, Clock, Filter } from 'lucide-react';

const JustificationHistoryModal = ({ isOpen, onClose, history }) => {
  const [filterMonth, setFilterMonth] = useState('all');

  if (!isOpen) return null;

  // Obtener meses únicos del historial
  const months = [...new Set(history.map(item => {
    const date = new Date(item.justifiedAt);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }))];

  // Filtrar historial por mes
  const filteredHistory = filterMonth === 'all'
    ? history
    : history.filter(item => {
      const date = new Date(item.justifiedAt);
      const itemMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return itemMonth === filterMonth;
    });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMonthName = (monthString) => {
    const [year, month] = monthString.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '900px',
          maxHeight: '90vh',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid rgba(99, 102, 241, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '2rem 2rem 1.5rem',
          borderBottom: '2px solid #e5e7eb',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          borderRadius: '16px 16px 0 0',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
              <Clock size={28} />
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'white',
                letterSpacing: '-0.02em'
              }}>
                Historial de Justificaciones
              </h2>
              <p style={{
                margin: '0.25rem 0 0',
                fontSize: '0.9375rem',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 500
              }}>
                {filteredHistory.length} {filteredHistory.length === 1 ? 'justificación registrada' : 'justificaciones registradas'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* Filter */}
        {months.length > 0 && (
          <div style={{
            padding: '1.5rem 2rem',
            borderBottom: '1px solid #e5e7eb',
            background: '#f9fafb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Filter size={18} style={{ color: '#6b7280' }} />
              <label style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151'
              }}>
                Filtrar por mes:
              </label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="all">Todos los meses</option>
                {months.map(month => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Body */}
        <div style={{
          padding: '2rem',
          maxHeight: '500px',
          overflowY: 'auto'
        }}>
          {filteredHistory.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              color: '#6b7280'
            }}>
              <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
                No hay justificaciones registradas
              </p>
              <p style={{ fontSize: '0.9375rem', margin: 0 }}>
                {filterMonth !== 'all'
                  ? 'No se encontraron justificaciones para el mes seleccionado'
                  : 'Aún no se han registrado justificaciones'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#6366f1';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <User size={20} />
                      </div>
                      <div>
                        <h3 style={{
                          margin: 0,
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: '#111827'
                        }}>
                          {item.studentName}
                        </h3>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginTop: '0.25rem'
                        }}>
                          <Calendar size={14} style={{ color: '#6b7280' }} />
                          <span style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            fontWeight: 500
                          }}>
                            {formatDate(item.justifiedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: '#f9fafb',
                    borderRadius: '8px',
                    padding: '1rem',
                    borderLeft: '4px solid #6366f1'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <FileText size={16} style={{ color: '#6366f1' }} />
                      <span style={{
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Motivo de Justificación
                      </span>
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: '0.9375rem',
                      color: '#1f2937',
                      lineHeight: '1.6',
                      fontStyle: 'italic'
                    }}>
                      "{item.reason}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem 2rem',
          borderTop: '2px solid #e5e7eb',
          background: '#f9fafb',
          borderRadius: '0 0 16px 16px',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default JustificationHistoryModal;
