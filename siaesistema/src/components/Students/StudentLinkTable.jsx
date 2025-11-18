// src/components/Students/StudentLinkTable.jsx
import React from 'react';
import { Link2 } from 'lucide-react'; // Icono para el botón

const StudentLinkTable = ({ 
    students, 
    onOpenLinkModal, 
    selectedStudents = [], 
    onSelectStudent, 
    onSelectAll 
}) => {
    // Verificar si todos los estudiantes están seleccionados
    const allSelected = students.length > 0 && selectedStudents.length === students.length;
    const someSelected = selectedStudents.length > 0 && selectedStudents.length < students.length;

    return (
        <div className="student-link-table-container">
            {students.length === 0 ? (
                <p className="no-students-message">No hay estudiantes en este semestre o no se encontraron.</p>
            ) : (
                <table className="student-link-table">
                    <thead>
                        <tr>
                            <th>Nombre Completo</th>
                            <th>Grupo</th>
                            <th>Matrícula</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student) => {
                            const isSelected = selectedStudents.includes(student.matricula);
                            return (
                                <tr key={student.matricula} className={isSelected ? 'selected-row' : ''}>
                                    <td>{student.nombre} {student.apellido}</td>
                                    <td>{student.salon_nombre || 'Sin grupo'}</td>
                                    <td>{student.matricula}</td>
                                    <td>
                                        <button
                                            className="action-button link-button"
                                            onClick={() => onOpenLinkModal(student)}
                                            // Deshabilita si ya tiene tarjetas NFC vinculadas
                                            disabled={student.tarjetas && student.tarjetas.length > 0}
                                            title={student.tarjetas && student.tarjetas.length > 0 ? 'NFC ya vinculado' : 'Vincular NFC'}
                                        >
                                            <Link2 size={16} />
                                            {student.tarjetas && student.tarjetas.length > 0 ? 'Vinculado' : 'Vincular'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default StudentLinkTable;