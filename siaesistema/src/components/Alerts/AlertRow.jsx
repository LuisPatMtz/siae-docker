// src/components/Alerts/AlertRow.jsx
import React from 'react'; // <-- ¡ESTA LÍNEA FALTABA!
import AbsenceHistory from './AbsenceHistory.jsx'; 
import { History } from 'lucide-react'; 

const AlertRow = ({ 
  alert, 
  onOpenJustifyModal, 
  onToggleHistory, 
  isHistoryExpanded 
}) => {

  let rowClass = 'alert-row';
  if (alert.unjustifiedFaltas >= 5) {
    rowClass += ' alert-row--danger'; 
  } else if (alert.unjustifiedFaltas >= 3) {
    rowClass += ' alert-row--warning'; 
  }

  return (
    <>
      <div className={rowClass}>
        <div className="alert-cell name-cell" data-label="Nombre">
          <span>{alert.nombre}</span>
          <button 
            className="history-btn" 
            onClick={() => onToggleHistory(alert.id)}
            title="Ver/Ocultar Historial de Faltas"
          >
            <History size={18} />
          </button>
        </div>
        
        <div className="alert-cell" data-label="Grupo">{alert.grupo}</div>
        
        <div className="alert-cell faltas-cell" data-label="Faltas">{alert.unjustifiedFaltas}</div> 
        
        <div className="alert-cell" data-label="Estado">
          <button 
            className="status-btn justify-action" 
            onClick={() => onOpenJustifyModal(alert.id, alert.nombre)}
          >
            Justificar
          </button>
        </div>
      </div>
      
      {isHistoryExpanded && (
        <div className="history-details-row">
          <AbsenceHistory dates={alert.unjustifiedDates} />
        </div>
      )}
    </>
  );
};

export default AlertRow;