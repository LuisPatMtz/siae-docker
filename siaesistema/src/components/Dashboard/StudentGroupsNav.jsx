// src/components/Dashboard/StudentGroupsNav.jsx
import React from 'react';

const StudentGroupsNav = ({ semesters, selectedGroup, onGroupSelect, showAllOption = false, activeMode }) => {
  // Calcular el total de grupos
  const totalGroups = Object.values(semesters).reduce((total, groups) => total + groups.length, 0);
  
  // Determinar el título dinámico
  const getTitleInfo = () => {
    if (activeMode === 'general') {
      return ` Total de grupos: (${totalGroups})`;
    }
    return `Grupos ${activeMode.charAt(0).toUpperCase() + activeMode.slice(1)} (${totalGroups} grupos)`;
  };

  return (
    <div className="card student-groups-nav filter-variant">
      <h2 className="card-title">{getTitleInfo()}</h2>

      {showAllOption && (
        <div className="group-buttons all-groups-button">
          <button
            className={`group-btn ${selectedGroup === 'all' ? 'active' : ''}`}
            onClick={() => onGroupSelect('all')}
          >
            Mostrar Todos
          </button>
        </div>
      )}

      <div className="semesters-container">
        {Object.keys(semesters).length === 0 ? (
          <div className="no-groups-message">
            <p>No hay grupos {activeMode !== 'general' ? `de turno ${activeMode}` : ''} disponibles</p>
          </div>
        ) : (
          Object.entries(semesters).map(([semesterName, groups]) => (
            <div key={semesterName} className="semester-section">
              <h3 className="semester-title">
                {semesterName} 
                <span className="group-count">({groups.length})</span>
              </h3>
              <div className="group-buttons">
                {groups.map((group) => (
                  <button
                    key={group}
                    className={`group-btn ${selectedGroup === group ? 'active' : ''}`}
                    onClick={() => onGroupSelect(group)}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentGroupsNav;