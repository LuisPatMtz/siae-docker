// src/components/Alerts/AlertsTable.jsx
import React from 'react';
import AlertRow from './AlertRow.jsx';

const AlertsTable = ({ 
  alerts, 
  searchQuery, 
  onSearchChange, 
  onOpenJustifyModal, // Nuevo prop
  onToggleHistory,    // Nuevo prop
  expandedHistoryId // Nuevo prop
}) => {

  return (
    <div className="card alerts-table-card">
      <h2 className="card-title">Lista de Alumnos con Faltas sin Justificar</h2> {/* Título actualizado */}
      
      <div className="search-bar-container">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nombre de alumno..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="alerts-table">
        {/* Cabecera Actualizada */}
        <div className="alert-header alert-header--reduced"> {/* Nueva clase para ajustar columnas */}
          <div className="alert-cell-header">Nombre del Alumno</div>
          <div className="alert-cell-header">Grupo</div>
          <div className="alert-cell-header">Faltas (Sin Justificar)</div> {/* Texto actualizado */}
          <div className="alert-cell-header">Acción</div> {/* Columna de estado ahora es Acción */}
        </div>
        
        <div className="alerts-table-body">
          {alerts.length === 0 ? (
            <p className="no-alerts">
              {searchQuery ? 'No se encontraron alumnos con ese nombre.' : 'No hay alertas activas.'}
            </p>
          ) : (
            alerts.map((alert) => (
              <AlertRow 
                key={alert.id}
                alert={alert}
                onOpenJustifyModal={onOpenJustifyModal} // Pasar el nuevo handler
                onToggleHistory={onToggleHistory}       // Pasar el handler de historial
                isHistoryExpanded={alert.id === expandedHistoryId} // Pasar si está expandido
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsTable;