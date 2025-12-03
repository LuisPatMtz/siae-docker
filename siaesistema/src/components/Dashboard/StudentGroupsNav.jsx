// src/components/Dashboard/StudentGroupsNav.jsx
import React from 'react';

const StudentGroupsNav = ({ semesters, selectedGroup, onGroupSelect, showAllOption = false, activeMode }) => {
  // Calcular el total de grupos
  const totalGroups = Object.values(semesters).reduce((total, groups) => total + groups.length, 0);
  
  return (
    <div className="card student-groups-nav filter-variant">
      <h2 className="card-title">Grupos</h2>

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
                    key={typeof group === 'object' ? group.id : group}
                    className={`group-btn ${selectedGroup === (typeof group === 'object' ? group.id : group) ? 'active' : ''}`}
                    onClick={() => onGroupSelect(typeof group === 'object' ? group.id : group)}
                  >
                    {typeof group === 'object' ? group.nombre : group}
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