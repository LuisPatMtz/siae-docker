import React, { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import JustificationHistoryModal from './JustificationHistoryModal';
import AlertStudentCard from './AlertStudentCard';
import TurnToggle from './TurnToggle';
import '../../styles/AlertasPage.css';

// Mock inicial de alertas
const MOCK_ALERTS_DATA = {
  morning: [
    {
      id: 1,
      studentName: 'Juan Pérez',
      studentId: 1,
      grade: '3°A',
      photoUrl: '/assets/img/student1.jpg',
      justifiedAbsenceDates: [],
      justificationReason: '',
      justificationStatus: 'pending',
      justificationDocument: null
    },
    {
      id: 2,
      studentName: 'María López',
      studentId: 2,
      grade: '3°A',
      photoUrl: '/assets/img/student2.jpg',
      justifiedAbsenceDates: [],
      justificationReason: '',
      justificationStatus: 'pending',
      justificationDocument: null
    }
  ],
  afternoon: [
    {
      id: 3,
      studentName: 'Valentina Soto',
      studentId: 3,
      grade: '2°B',
      photoUrl: '/assets/img/student3.jpg',
      justifiedAbsenceDates: [],
      justificationReason: '',
      justificationStatus: 'pending',
      justificationDocument: null
    }
  ]
};

// Mock de historial inicial (para pruebas)
const MOCK_HISTORY_DATA = [
  {
    id: 'hist-001',
    studentId: 3,
    studentName: 'Valentina Soto',
    reason: 'Fiebre alta',
    justifiedAbsenceDates: ['2025-10-15', '2025-10-16'],
    submissionDate: '2025-10-17T10:00:00.000Z'
  }
];

const AlertasPage = () => {
  const [activeMode, setActiveMode] = useState('morning');
  const [studentsData, setStudentsData] = useState(MOCK_ALERTS_DATA.morning);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [justificationHistory, setJustificationHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('justificationHistory');
      return saved ? JSON.parse(saved) : MOCK_HISTORY_DATA;
    } catch (e) {
      console.error('Error reading justificationHistory from localStorage', e);
      return MOCK_HISTORY_DATA;
    }
  });
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState('all');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Actualizar alumnos al cambiar turno
  useEffect(() => {
    console.log(`Cargando alertas para el turno: ${activeMode}`);
    setStudentsData(MOCK_ALERTS_DATA[activeMode]);
  }, [activeMode]);

  // Guardar historial en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('justificationHistory', JSON.stringify(justificationHistory));
    } catch (e) {
      console.error('Error saving justificationHistory to localStorage', e);
    }
  }, [justificationHistory]);

  const handleModeToggle = (mode) => setActiveMode(mode);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
  };

  const handleCloseStudentCard = () => {
    setSelectedStudent(null);
  };

  const submitJustification = (studentId, reason, dates) => {
    console.log(`Enviando justificación para ID ${studentId}: ${reason}`);
    const updatedStudents = studentsData.map((student) =>
      student.studentId === studentId
        ? {
            ...student,
            justificationStatus: 'justified',
            justificationReason: reason,
            justifiedAbsenceDates: dates
          }
        : student
    );
    setStudentsData(updatedStudents);

    const studentData = updatedStudents.find((s) => s.studentId === studentId);
    const newEntry = {
      id: Date.now(),
      studentId: studentData.studentId,
      studentName: studentData.studentName,
      reason,
      justifiedAbsenceDates: dates,
      submissionDate: new Date().toISOString()
    };
    setJustificationHistory((prev) => [...prev, newEntry]);
    setSelectedStudent(null);
  };

  const handleViewHistory = () => setIsHistoryModalOpen(true);
  const closeHistoryModal = () => setIsHistoryModalOpen(false);
  const openClearConfirm = () => setIsConfirmClearOpen(true);
  const closeClearConfirm = () => setIsConfirmClearOpen(false);

  const handleClearHistory = async () => {
    console.log(`Borrando historial para el modo: ${activeMode}`);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simula API
    setJustificationHistory([]);
    try {
      localStorage.removeItem('justificationHistory');
    } catch (e) {
      console.error(e);
    }
    closeClearConfirm();
  };

  // Filtrar historial por mes
  const filteredHistory = justificationHistory.filter((entry) => {
    if (!entry) return false;
    if (!entry.submissionDate || typeof entry.submissionDate !== 'string') {
      return selectedHistoryMonth === 'all';
    }

    let submissionDateObject = new Date(entry.submissionDate);
    if (isNaN(submissionDateObject.getTime())) {
      return selectedHistoryMonth === 'all';
    }

    if (selectedHistoryMonth === 'all') return true;
    return submissionDateObject.getMonth() + 1 === parseInt(selectedHistoryMonth, 10);
  });

  return (
    <div className="alertas-page">
      <h1>Justificación de Alumnos</h1>

      <TurnToggle activeMode={activeMode} onToggle={handleModeToggle} />

      <div className="alerts-container">
        {studentsData.length > 0 ? (
          studentsData.map((student) => (
            <div key={student.id} onClick={() => handleSelectStudent(student)}>
              <AlertStudentCard student={student} />
            </div>
          ))
        ) : (
          <p>No hay alumnos con alertas en este turno.</p>
        )}
      </div>

      {selectedStudent && (
        <AlertStudentCard
          student={selectedStudent}
          onClose={handleCloseStudentCard}
          onSubmitJustification={submitJustification}
          isModal
        />
      )}

      <div className="history-controls">
        <button onClick={handleViewHistory} className="view-history-btn">
          Ver Historial de Justificaciones
        </button>
        <button onClick={openClearConfirm} className="clear-history-btn">
          Borrar Historial
        </button>
      </div>

      {isHistoryModalOpen && (
        <JustificationHistoryModal
          onClose={closeHistoryModal}
          history={filteredHistory}
          selectedMonth={selectedHistoryMonth}
          onMonthChange={setSelectedHistoryMonth}
          onClearHistory={openClearConfirm}
        />
      )}

      {isConfirmClearOpen && (
        <ConfirmationModal
          message="¿Seguro que deseas borrar todo el historial?"
          onConfirm={handleClearHistory}
          onCancel={closeClearConfirm}
        />
      )}
    </div>
  );
};

export default AlertasPage;
