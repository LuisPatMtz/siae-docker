import React from 'react';

const PERIOD_LABELS = {
  week: 'Semana Actual',
  month: 'Mes Actual',
  semester: 'Total Semestre'
};

const PeriodStatsCard = ({ periodData, selectedPeriod }) => {
  if (!periodData || !periodData[selectedPeriod]) {
    return null;
  }

  const data = periodData[selectedPeriod];
  const label = PERIOD_LABELS[selectedPeriod];

  return (
    <div className="period-stats-single-card">
      <div className="period-stat-header">
        <h4>{label}</h4>
        <span className="period-dates">
          {data.inicio && data.fin ? (
            `${new Date(data.inicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - ${new Date(data.fin).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
          ) : 'Calculando...'}
        </span>
      </div>
      <div className="period-stat-body">
        <div className="period-percentage">{data.porcentaje?.toFixed(1)}%</div>
        <div className="period-info">{data.dias_habiles} días hábiles</div>
      </div>
      <div className="period-progress-bar">
        <div 
          className="period-progress-fill"
          style={{ width: `${data.porcentaje || 0}%` }}
        ></div>
      </div>
    </div>
  );
};

export default PeriodStatsCard;
