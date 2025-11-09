// src/components/Dashboard/StatsCard.jsx
import React from 'react';

const StatsCard = ({ title, totalStudents, averageAttendance }) => {
  return (
    <div className="card stats-card">
      <h2 className="card-title">{title}</h2>
      
      <div className="stats-circle">
        <span className="stats-circle-label">Total de Estudiantes</span>
        
        <span className="stats-circle-number">
          {totalStudents.toLocaleString('es-MX')}
        </span>
        
        <span className="stats-circle-sublabel">
          Asistencia Promedio: {averageAttendance.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

export default StatsCard;