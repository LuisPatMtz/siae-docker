// src/components/Alerts/JustificationHistoryModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, User, FileText, Clock, Filter, Eye } from 'lucide-react';
import { faltasService } from '../../api/services';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const JustificationHistoryModal = ({ isOpen, onClose, history }) => {
  const [filterMonth, setFilterMonth] = useState('all');
  const [faltasPorJustificacion, setFaltasPorJustificacion] = useState({});
  const [loadingFaltas, setLoadingFaltas] = useState(false);
  const [selectedJustification, setSelectedJustification] = useState(null);
  const [showDaysModal, setShowDaysModal] = useState(false);

  // Manejar tecla ESC para ambos modales
  useEscapeKey(showDaysModal, () => setShowDaysModal(false));
  useEscapeKey(isOpen && !showDaysModal, onClose);

  // Cargar las faltas para obtener las fechas justificadas
  useEffect(() => {
    if (isOpen && history.length > 0) {
      cargarFaltasJustificadas();
    }
  }, [isOpen, history]);

  const cargarFaltasJustificadas = async () => {
    setLoadingFaltas(true);
    try {
      // Obtener IDs de justificaciones del historial
      const justificacionIds = history.map(h => h.justificacionId || h.id);
      console.log('IDs de justificaciones en historial:', justificacionIds);
      
      // Obtener todas las faltas justificadas
      const faltasResponse = await faltasService.getAll({ estado: 'Justificado' });
      console.log('Faltas justificadas cargadas:', faltasResponse);
      
      // Agrupar faltas por combinación de justificación + matrícula
      const faltasPorJust = {};
      faltasResponse.forEach(falta => {
        console.log(`Falta ${falta.id}: id_justificacion=${falta.id_justificacion}, matricula=${falta.matricula_estudiante}, fecha=${falta.fecha}`);
        if (falta.id_justificacion && falta.matricula_estudiante) {
          // Crear clave única: justificacionId-matricula
          const key = `${falta.id_justificacion}-${falta.matricula_estudiante}`;
          if (!faltasPorJust[key]) {
            faltasPorJust[key] = [];
          }
          faltasPorJust[key].push(falta);
        }
      });
      
      console.log('Faltas agrupadas por justificación+matrícula:', faltasPorJust);
      console.log('Verificación de coincidencias:');
      history.forEach(item => {
        const key = `${item.justificacionId || item.id}-${item.matriculaEstudiante}`;
        console.log(`  Justificación ${item.justificacionId || item.id} - ${item.studentName}: ${faltasPorJust[key] ? faltasPorJust[key].length : 0} faltas`);
      });
      
      setFaltasPorJustificacion(faltasPorJust);
    } catch (error) {
      console.error('Error al cargar faltas justificadas:', error);
    } finally {
      setLoadingFaltas(false);
    }
  };

  if (!isOpen) return null;

  // El backend ya guarda las fechas en hora de México (UTC-6)
  // Solo necesitamos parsear y formatear, sin conversiones adicionales
  const parseDate = (dateString) => {
    return new Date(dateString);
  };

  // Obtener meses únicos del historial
  const months = [...new Set(history.map(item => {
    const date = parseDate(item.justifiedAt);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }))];

  // Filtrar historial por mes
  const filteredHistory = filterMonth === 'all'
    ? history
    : history.filter(item => {
      const date = parseDate(item.justifiedAt);
      const itemMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return itemMonth === filterMonth;
    });

  const formatDate = (dateString) => {
    const date = parseDate(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Mexico_City' // Asegurar que se interprete en zona horaria de México
    });
  };

  const getMonthName = (monthString) => {
    const [year, month] = monthString.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  };

  // Abrir modal de días justificados
  const handleOpenDaysModal = (item) => {
    const key = `${item.justificacionId || item.id}-${item.matriculaEstudiante}`;
    console.log('Abriendo modal de días para:', item);
    console.log('Key generada:', key);
    console.log('Faltas disponibles:', faltasPorJustificacion[key]);
    console.log('Estado showDaysModal antes:', showDaysModal);
    
    setSelectedJustification({
      ...item,
      faltas: faltasPorJustificacion[key] || []
    });
    setShowDaysModal(true);
    
    console.log('Estado showDaysModal después:', true);
  };

  // Renderizar modal de días justificados
  const renderDaysModal = () => {
    if (!showDaysModal || !selectedJustification) return null;

    const faltas = selectedJustification.faltas;
    
    // Obtener fechas únicas de las faltas
    const fechas = faltas.map(falta => {
      const fecha = new Date(falta.fecha);
      return fecha.toISOString().split('T')[0];
    });
    const fechasUnicas = [...new Set(fechas)].sort();

    return (
      <div 
        className="modal-overlay" 
        onClick={() => setShowDaysModal(false)}
        style={{ zIndex: 10000 }}
      >
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '1.5rem 2rem',
            borderBottom: '2px solid #e5e7eb',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
                <Calendar size={28} />
              </div>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'white',
                  letterSpacing: '-0.02em'
                }}>
                  Días Justificados
                </h2>
                <p style={{
                  margin: '0.25rem 0 0',
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 500
                }}>
                  {selectedJustification.studentName}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDaysModal(false)}
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

          {/* Content */}
          <div style={{ padding: '1.5rem' }}>
            {fechasUnicas.length === 0 ? (
              <div style={{
                padding: '2rem',
                background: '#fff3cd',
                borderRadius: '8px',
                border: '1px solid #ffc107',
                textAlign: 'center'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: '#856404',
                  fontStyle: 'italic'
                }}>
                  No se encontraron días específicos para esta justificación
                </span>
              </div>
            ) : (
              <>
                <div style={{
                  marginBottom: '1rem',
                  padding: '0.5rem 0.75rem',
                  background: '#dbeafe',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#1e40af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'inline-block'
                }}>
                  {fechasUnicas.length} {fechasUnicas.length === 1 ? 'día' : 'días'}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {fechasUnicas.map((fecha, index) => {
                    const date = new Date(fecha + 'T12:00:00');
                    const dia = date.getDate();
                    const mes = date.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase();
                    const diaSemana = date.toLocaleDateString('es-MX', { weekday: 'short' }).toUpperCase();
                    
                    return (
                      <div
                        key={index}
                        style={{
                          background: '#fee2e2',
                          border: '2px solid #fca5a5',
                          borderRadius: '6px',
                          padding: '0.5rem 0.35rem',
                          textAlign: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fecaca';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fee2e2';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <div style={{
                          fontSize: '0.5625rem',
                          fontWeight: 700,
                          color: '#991b1b',
                          textTransform: 'uppercase',
                          marginBottom: '0.15rem',
                          letterSpacing: '0.05em'
                        }}>
                          {diaSemana}
                        </div>
                        <div style={{
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: '#dc2626',
                          lineHeight: '1',
                          margin: '0.15rem 0'
                        }}>
                          {dia}
                        </div>
                        <div style={{
                          fontSize: '0.5625rem',
                          fontWeight: 700,
                          color: '#991b1b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {mes}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '0.75rem 1.5rem',
            borderTop: '2px solid #e5e7eb',
            background: '#f9fafb',
            borderRadius: '0 0 16px 16px',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => setShowDaysModal(false)}
              style={{
                padding: '0.625rem 1.25rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(99, 102, 241, 0.2)';
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {renderDaysModal()}
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
                {filteredHistory.length} {filteredHistory.length === 1 ? 'registro' : 'registros'}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredHistory.map((item) => (
                <div
                  key={`${item.justificacionId || item.id}-${item.matriculaEstudiante}`}
                  style={{
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '1rem',
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <User size={18} />
                      </div>
                      <div>
                        <h3 style={{
                          margin: 0,
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: '#111827'
                        }}>
                          {item.studentName}
                        </h3>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginTop: '0.25rem',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={13} style={{ color: '#6b7280' }} />
                            <span style={{
                              fontSize: '0.8125rem',
                              color: '#6b7280',
                              fontWeight: 500
                            }}>
                              {formatDate(item.justifiedAt)}
                            </span>
                          </div>
                          {item.faltasCount && (
                            <span style={{
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              color: '#6366f1',
                              background: '#eef2ff',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px'
                            }}>
                              {item.faltasCount} {item.faltasCount === 1 ? 'falta' : 'faltas'}
                            </span>
                          )}
                          {item.estudiantesCount && item.estudiantesCount > 1 && (
                            <span style={{
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              color: '#8b5cf6',
                              background: '#f5f3ff',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px'
                            }}>
                              {item.estudiantesCount} estudiantes
                            </span>
                          )}
                          {item.usuario && (
                            <span style={{
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              color: '#059669',
                              background: '#d1fae5',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px'
                            }}>
                              Por: {item.usuario}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Botón para ver días justificados */}
                    <button
                      onClick={() => handleOpenDaysModal(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem 0.875rem',
                        border: '1px solid #3b82f6',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        background: 'white',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#3b82f6';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.color = '#3b82f6';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <Eye size={15} />
                      Ver Días ({item.faltasCount})
                    </button>
                  </div>

                  <div style={{
                    background: '#f0f9ff',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    borderLeft: '3px solid #6366f1'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                      <FileText size={14} style={{ color: '#6366f1' }} />
                      <span style={{
                        fontSize: '0.75rem',
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
                      fontSize: '0.875rem',
                      color: '#1f2937',
                      lineHeight: '1.5',
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
    </>
  );
};

export default JustificationHistoryModal;
