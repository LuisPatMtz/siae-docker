import React from "react";
import dayjs from "dayjs"; // ✅ asegúrate de tenerlo instalado: npm install dayjs

const MONTHS = [
  { value: "1", label: "Enero" }, { value: "2", label: "Febrero" }, { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" }, { value: "5", label: "Mayo" }, { value: "6", label: "Junio" },
  { value: "7", label: "Julio" }, { value: "8", label: "Agosto" }, { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" }, { value: "11", label: "Noviembre" }, { value: "12", label: "Diciembre" }
];

const JustificationHistoryModal = ({
  isOpen,
  onClose,
  history,
  selectedMonth,
  onMonthChange,
  onClearHistory
}) => {
  if (!isOpen) return null;

  const canClear = history && history.length > 0;

  // 🧠 Función para mostrar la fecha de justificación formateada
  const formatDate = (date) => {
    if (!date) return "Sin fecha registrada";
    const d = dayjs(date);
    return d.isValid() ? d.format("DD/MM/YYYY HH:mm") : "Fecha inválida";
  };

  // 🧠 Función para mostrar fechas justificadas
  const formatJustifiedDates = (dates) => {
    if (!dates || dates.length === 0) return "Sin fechas registradas";
    return dates.map(d => dayjs(d).isValid() ? dayjs(d).format("DD/MM/YYYY") : d).join(", ");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content history-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">Historial de Justificaciones</h2>

        {/* --- FILTRO POR MES --- */}
        <div className="month-filter-container">
          <label htmlFor="monthSelect">Filtrar por Mes:</label>
          <select
            id="monthSelect"
            className="month-filter-select"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
          >
            <option value="all">Todos los Meses</option>
            {MONTHS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        {/* --- TABLA DE HISTORIAL --- */}
        <div className="history-list-container">
          {(!history || history.length === 0) ? (
            <p className="no-history">
              {selectedMonth === "all"
                ? "Aún no se han registrado justificaciones."
                : "No hay justificaciones registradas para el mes seleccionado."}
            </p>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Motivo</th>
                  <th>Fechas Justificadas</th>
                  <th>Fecha/Hora de Justificación</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.studentName || "Desconocido"}</td>
                    <td>{entry.reason || "Sin motivo"}</td>
                    <td>{formatJustifiedDates(entry.justifiedAbsenceDates)}</td>
                    <td>{formatDate(entry.submissionDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* --- BOTONES DE ACCIÓN --- */}
        <div className="modal-actions history-actions">
          <button
            className="modal-btn clear-history"
            onClick={onClearHistory}
            disabled={!canClear}
          >
            Borrar Historial
          </button>
          <button className="modal-btn cancel" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default JustificationHistoryModal;
