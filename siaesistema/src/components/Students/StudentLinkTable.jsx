// src/components/Students/StudentLinkTable.jsx
import React from 'react';
import { Link2 } from 'lucide-react'; // Icono para el botón

const StudentLinkTable = ({ students, onOpenLinkModal }) => {
    return (
        <div className="student-link-table-container">
            {students.length === 0 ? (
                <p className="no-students-message">No hay estudiantes en este grupo o no se encontraron.</p>
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
                        {students.map((student) => (
                            <tr key={student.id}>
                                <td>{student.nombre}</td>
                                <td>{student.grupo}</td>
                                <td>{student.matricula}</td>
                                <td>
                                    <button
                                        className="action-button link-button"
                                        onClick={() => onOpenLinkModal(student)}
                                        // Deshabilita si ya tiene un nfcId vinculado
                                        disabled={!!student.nfcId}
                                        title={student.nfcId ? 'NFC ya vinculado' : 'Vincular NFC'}
                                    >
                                        <Link2 size={16} />
                                        {student.nfcId ? 'Vinculado' : 'Vincular'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default StudentLinkTable;