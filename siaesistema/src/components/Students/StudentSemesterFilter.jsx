// src/components/Students/StudentSemesterFilter.jsx
import React from 'react';

const StudentSemesterFilter = ({ 
    semesters, 
    selectedSemester, 
    onSemesterSelect 
}) => {
    // Obtener la lista de semestres únicos
    const uniqueSemesters = [...new Set(Object.values(semesters).flat())];
    const sortedSemesters = uniqueSemesters.sort((a, b) => a - b);

    return (
        <div className="card student-groups-nav filter-variant">
            <h2 className="card-title">Filtrar por Semestre</h2>

            <div className="group-buttons all-groups-button">
                <button
                    className={`group-btn ${selectedSemester === 'all' ? 'active' : ''}`}
                    onClick={() => onSemesterSelect('all')}
                >
                    Todos los Semestres
                </button>
            </div>

            <div className="semesters-container">
                {sortedSemesters.length === 0 ? (
                    <div className="no-groups-message">
                        <p>No hay semestres disponibles</p>
                    </div>
                ) : (
                    <div className="semester-section">
                        <h3 className="semester-title">
                            Selecciona un Semestre
                            <span className="group-count">({sortedSemesters.length})</span>
                        </h3>
                        <div className="group-buttons">
                            {sortedSemesters.map((semester) => (
                                <button
                                    key={semester}
                                    className={`group-btn ${selectedSemester === semester ? 'active' : ''}`}
                                    onClick={() => onSemesterSelect(semester)}
                                >
                                    {semester}° Semestre
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentSemesterFilter;
