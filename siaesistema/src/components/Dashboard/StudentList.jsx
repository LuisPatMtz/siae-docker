// src/components/Dashboard/StudentList.jsx
import React from 'react';

const StudentList = ({ title, students }) => {
  return (
    <div className="card">
      <h2 className="card-title">{title}</h2>
      
      <div className="student-list">
        {students.length === 0 ? (
          <p>No hay estudiantes para mostrar.</p>
        ) : (
          students.map((student) => (
            <div 
              key={student.id} 
              className="list-item"
            >
              <span>{student.name}</span>
              <span className="list-item-group">{student.group}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};


export default StudentList;