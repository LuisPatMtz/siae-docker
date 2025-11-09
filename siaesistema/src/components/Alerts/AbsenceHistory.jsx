// src/components/Alerts/AbsenceHistory.jsx
import React from 'react';

const AbsenceHistory = ({ dates }) => {
  if (!dates || dates.length === 0) {
    return <div className="absence-history empty">No hay fechas de faltas sin justificar registradas.</div>;
  }

  return (
    <div className="absence-history">
      <h4>Fechas sin Justificar:</h4>
      <ul>
        {dates.map((date, index) => (
          <li key={index}>{date}</li>
        ))}
      </ul>
    </div>
  );
};

export default AbsenceHistory;