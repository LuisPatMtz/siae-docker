// src/components/Dashboard/GroupAttendanceCard.jsx
import React, { useState } from 'react';

// Opciones de período
const PERIOD_OPTIONS = [
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'semester', label: 'Ciclo Escolar' },
  { key: 'custom', label: 'Personalizado' },
];

const GroupAttendanceCard = ({ 
  groupName, 
  attendanceData, // Ahora recibe todo el objeto { totalStudents, attendance: { week, ... } }
  selectedPeriod, // 'week', 'month', 'semester', o 'custom'
  onPeriodChange, // La función "interruptor" para cambiar el período
  isLoading, // Nuevo prop para mostrar que está cargando
  onCustomDateChange // Nueva prop para manejar rango personalizado
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handlePeriodClick = (key) => {
    if (key === 'custom') {
      setShowDatePicker(!showDatePicker);
    } else {
      setShowDatePicker(false);
      onPeriodChange(key);
    }
  };

  const handleApplyCustomRange = () => {
    if (startDate && endDate) {
      console.log('Aplicando rango personalizado:', startDate, 'a', endDate);
      // Actualizar fechas y periodo simultáneamente
      onCustomDateChange(startDate, endDate);
      onPeriodChange('custom');
      setShowDatePicker(false);
    }
  };
  
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
    <div className="card group-attendance-card layout-compact">
      {/* Layout horizontal: Selectores a la izquierda, Resumen a la derecha */}
      <div className="attendance-compact-container">
        {/* Columna Izquierda: Selectores de Período */}
        <div className="period-selectors-compact">
          <h3 className="period-title">Periodo</h3>
          <div className="period-buttons-wrapper">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.key}
                className={`period-btn-compact ${selectedPeriod === option.key ? 'active' : ''}`}
                onClick={() => handlePeriodClick(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* Selector de rango personalizado */}
          {showDatePicker && (
            <div className="custom-date-picker">
              <div className="date-input-group">
                <label>Desde:</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-input"
                />
              </div>
              <div className="date-input-group">
                <label>Hasta:</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-input"
                />
              </div>
              <button 
                className="apply-custom-btn"
                onClick={handleApplyCustomRange}
                disabled={!startDate || !endDate}
              >
                Aplicar
              </button>
            </div>
          )}
        </div>

        {/* Columna Derecha: Resumen Compacto */}
        <div className="attendance-summary-compact">
          <h2 className="card-title-compact">Grupo {groupName}</h2>
          <div className="percentage-display-compact">
            <span className="percentage-number-compact">
              {percentage}{percentage !== "..." && "%"}
            </span>
            <span className="percentage-label-compact">Asistencia</span>
          </div>
          <p className="students-count-compact">
            <strong>{totalStudents}</strong> estudiantes
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupAttendanceCard;