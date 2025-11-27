// src/components/Alerts/AbsenceHistory.jsx
import React from 'react';
import { Calendar } from 'lucide-react';

const AbsenceHistory = ({ dates }) => {
  if (!dates || dates.length === 0) {
    return <div className="absence-history empty">No hay fechas de faltas sin justificar registradas.</div>;
  }

  // Helper to format date string to Date object
  const parseDate = (dateStr) => {
    // Assuming dateStr is YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Group dates by month
  const groupedDates = dates.reduce((acc, dateStr) => {
    const date = parseDate(dateStr);
    const monthYear = date.toLocaleString('es-MX', { month: 'long', year: 'numeric' });
    // Use zero-padded month for correct string sorting: 2025-09 vs 2025-10
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!acc[key]) {
      acc[key] = {
        label: monthYear.charAt(0).toUpperCase() + monthYear.slice(1),
        dates: []
      };
    }

    acc[key].dates.push({
      fullDate: dateStr,
      day: date.getDate(),
      dayName: date.toLocaleString('es-MX', { weekday: 'short' }).replace('.', '')
    });

    return acc;
  }, {});

  // Sort months descending (newest first)
  const sortedMonths = Object.keys(groupedDates).sort((a, b) => b.localeCompare(a));

  return (
    <div className="absence-history-container">
      <div className="history-header">
        <Calendar size={16} />
        <h4>Historial Detallado de Faltas</h4>
      </div>

      <div className="months-grid">
        {sortedMonths.map(key => {
          const group = groupedDates[key];
          // Sort dates within month ascending (1-31) for calendar-like reading
          group.dates.sort((a, b) => a.day - b.day);

          return (
            <div key={key} className="month-group">
              <h5 className="month-title">{group.label}</h5>
              <div className="dates-grid">
                {group.dates.map((dateObj, idx) => (
                  <div key={idx} className="date-chip" title={dateObj.fullDate}>
                    <span className="day-name">{dateObj.dayName}</span>
                    <span className="day-number">{dateObj.day}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AbsenceHistory;