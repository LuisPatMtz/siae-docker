// src/components/Dashboard/GroupAttendanceCard.jsx
import React from 'react';

// Opciones de período
const PERIOD_OPTIONS = [
  { key: 'week', label: 'Semana Actual' },
  { key: 'month', label: 'Mes Actual' },
  { key: 'semester', label: 'Total Semestre' },
];

const GroupAttendanceCard = ({ 
  groupName, 
  attendanceData, // Ahora recibe todo el objeto { totalStudents, attendance: { week, ... } }
  selectedPeriod, // 'week', 'month', o 'semester'
  onPeriodChange, // La función "interruptor" para cambiar el período
  isLoading // Nuevo prop para mostrar que está cargando
}) => {
  
  // Si no hay grupo seleccionado, muestra el mensaje
  if (!groupName) {
    return (
      <div className="card group-attendance-card">
        <h2 className="card-title">Asistencia del Grupo</h2>
        <p className="no-group-selected">Selecciona un salón para ver su asistencia.</p>
      </div>
    );
  }

  // Extraemos los datos. Si está cargando, mostramos "..."
  const percentage = isLoading ? "..." : (attendanceData?.attendance[selectedPeriod]?.toFixed(1) || "N/A");
  const totalStudents = isLoading ? "..." : (attendanceData?.totalStudents || 0);

  return (
    <div className="card group-attendance-card layout-split">
      {/* Columna Izquierda: Selectores de Período */}
      <div className="period-selectors">
        <h3 className="period-title">Seleccionar Periodo</h3>
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.key}
            className={`period-btn ${selectedPeriod === option.key ? 'active' : ''}`}
            onClick={() => onPeriodChange(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Columna Derecha: Estadística */}
      <div className="attendance-details-container">
        <h2 className="card-title centered-title">Asistencia del Grupo {groupName}</h2>
        <div className="attendance-details">
          <div className="attendance-percentage-circle">
            <span className="attendance-number">
              {percentage}{percentage !== "..." && "%"}
            </span>
            <span className="attendance-label">Asistencia</span>
          </div>
          <p className="total-students-info">
            Total de estudiantes: <strong>{totalStudents}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupAttendanceCard;