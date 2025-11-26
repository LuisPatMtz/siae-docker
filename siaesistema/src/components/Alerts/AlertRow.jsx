// src/components/Alerts/AlertRow.jsx
import React from 'react';
import AbsenceHistory from './AbsenceHistory.jsx';
import { History, CheckCircle, Phone } from 'lucide-react';

const AlertRow = ({
  alert,
  onOpenJustifyModal,
  onToggleHistory,
  isHistoryExpanded,
  onOpenContactModal
}) => {

  let rowClass = '';
  if (alert.unjustifiedFaltas >= 5) {
    rowClass = 'alert-danger';
  } else if (alert.unjustifiedFaltas >= 3) {
    rowClass = 'alert-warning';
  }

  return (
    <>
      <tr className={rowClass}>
        <td className="td-nombre">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>{alert.nombre}</span>
            <button
              className="btn-action btn-view-history"
              onClick={() => onToggleHistory(alert.id)}
              title="Ver/Ocultar Historial de Faltas"
            >
              <History size={18} />
            </button>
          </div>
        </td>

        <td className="td-grupo">{alert.grupo}</td>

        <td className="td-faltas" style={{ textAlign: 'center' }}>
          <span className={`badge-alert-level ${alert.unjustifiedFaltas >= 5 ? 'badge-danger' : alert.unjustifiedFaltas >= 3 ? 'badge-warning' : ''}`}>
            {alert.unjustifiedFaltas} {alert.unjustifiedFaltas === 1 ? 'falta' : 'faltas'}
          </span>
        </td>

        <td>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              onClick={() => onOpenContactModal(alert)}
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.8125rem',
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(6, 182, 212, 0.2)'
              }}
              title="Ver información de contacto"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(6, 182, 212, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(6, 182, 212, 0.2)';
              }}
            >
              <Phone size={14} />
              Contactar
            </button>
            <button
              onClick={() => onOpenJustifyModal(alert.id, alert.nombre)}
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.8125rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
              }}
            >
              <CheckCircle size={14} />
              Justificar
            </button>
          </div>
        </td>
      </tr>

      {isHistoryExpanded && (
        <tr className="history-details-row">
          <td colSpan="4" style={{ padding: '1.5rem 2rem', background: '#f8fafc' }}>
            <AbsenceHistory dates={alert.unjustifiedDates} />
          </td>
        </tr>
      )}
    </>
  );
};

export default AlertRow;