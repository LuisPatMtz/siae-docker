// src/components/Alerts/AlertsTable.jsx
import React from 'react';
import AlertRow from './AlertRow.jsx';

const AlertsTable = ({
  alerts,
  searchQuery,
  onSearchChange,
  onOpenJustifyModal,
  onToggleHistory,
  expandedHistoryId,
  onOpenContactModal
}) => {

  return (
    <div className="alertas-table-card">
      <div className="table-section-header">
        <h2 className="section-title">Lista de Alumnos con Faltas sin Justificar</h2>
      </div>

      <div className="alerts-table-container">
        <table className="alerts-table">
          <thead>
            <tr>
              <th>Nombre del Alumno</th>
              <th>Grupo</th>
              <th>Faltas (Sin Justificar)</th>
              <th>Acción</th>
            </tr>
          </thead>

          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>
                  <p className="no-alerts">
                    {searchQuery ? 'No se encontraron alumnos con ese nombre.' : 'No hay alertas activas.'}
                  </p>
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  onOpenJustifyModal={onOpenJustifyModal}
                  onToggleHistory={onToggleHistory}
                  isHistoryExpanded={alert.id === expandedHistoryId}
                  onOpenContactModal={onOpenContactModal}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertsTable;