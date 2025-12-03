// src/pages/CorteFaltasPage.jsx
import React, { useState, useEffect } from 'react';
import { cyclesApi } from '../api/cyclesApi';
import { faultsApi } from '../api/faultsApi';
import { Calendar, CheckCircle, AlertTriangle, FileText, Play } from 'lucide-react';
import Modal from '../components/UI/Modal';
import { useToast } from '../contexts/ToastContext.jsx';
import PageContainer from '../components/Common/PageContainer.jsx';
import '../styles/corte-faltas.css';

const CorteFaltasPage = () => {
  const { showSuccess, showError } = useToast();

  const [ciclos, setCiclos] = useState([]);
  const [cicloSeleccionado, setCicloSeleccionado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [diasHabiles, setDiasHabiles] = useState(null);
  const [reporte, setReporte] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conteoCortes, setConteoCortes] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Auto-seleccionar fechas cuando cambia el ciclo
  useEffect(() => {
    if (cicloSeleccionado && ciclos.length > 0) {
      // Buscar por id o id_ciclo para asegurar compatibilidad
      const ciclo = ciclos.find(c =>
        (c.id && c.id.toString() === cicloSeleccionado.toString()) ||
        (c.id_ciclo && c.id_ciclo.toString() === cicloSeleccionado.toString())
      );

      if (ciclo && ciclo.fecha_inicio) {
        try {
          // Asegurar formato YYYY-MM-DD
          const fechaInicioCiclo = new Date(ciclo.fecha_inicio).toISOString().split('T')[0];
          const fechaHoy = new Date().toISOString().split('T')[0];

          setFechaInicio(fechaInicioCiclo);
          setFechaFin(fechaHoy);
          setDiasHabiles(null); // Resetear cálculo previo
        } catch (e) {
          console.error("Error al formatear fechas del ciclo:", e);
        }
      }
    }
  }, [cicloSeleccionado, ciclos]);

  // Cargar ciclos escolares al montar
  useEffect(() => {
    cargarCiclos();
  }, []);

  const cargarCiclos = async () => {
    try {
      const data = await cyclesApi.getAll();
      setCiclos(data);

      // Seleccionar el ciclo activo por defecto
      const cicloActivo = data.find(c => c.activo);
      if (cicloActivo) {
        const id = cicloActivo.id || cicloActivo.id_ciclo;
        if (id) {
          setCicloSeleccionado(id.toString());
        }
      }
    } catch (err) {
      console.error('Error al cargar ciclos:', err);
      setError('No se pudieron cargar los ciclos escolares');
    }
  };

  const calcularDiasHabiles = async () => {
    if (!fechaInicio || !fechaFin) {
      setError('Selecciona ambas fechas');
      return;
    }

    try {
      const data = await faultsApi.calcularDiasHabiles(fechaInicio, fechaFin);
      setDiasHabiles(data);
      setError('');
    } catch (err) {
      console.error('Error al calcular días hábiles:', err);
      setError('Error al calcular días hábiles');
    }
  };

  const generarReporte = async () => {
    if (!cicloSeleccionado || !fechaInicio || !fechaFin) {
      setError('Selecciona ciclo y rango de fechas');
      return;
    }

    setLoading(true);
    setError('');
    setResultado(null);

    try {
      const data = await faultsApi.obtenerReporteAsistencias(
        parseInt(cicloSeleccionado),
        fechaInicio,
        fechaFin
      );
      setReporte(data);
    } catch (err) {
      console.error('Error al generar reporte:', err);
      setError('Error al generar el reporte de asistencias');
    } finally {
      setLoading(false);
    }
  };

  const procesarCorte = () => {
    if (!cicloSeleccionado || !fechaInicio || !fechaFin) {
      setError('Completa todos los campos requeridos');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmarCorte = async () => {
    setLoading(true);
    setError('');
    setReporte(null);
    setShowConfirmModal(false);

    try {
      const data = await faultsApi.procesarCorte(
        parseInt(cicloSeleccionado),
        fechaInicio,
        fechaFin
      );
      setResultado(data);
      setConteoCortes(prev => prev + 1);
      showSuccess('Corte de faltas procesado exitosamente');
    } catch (err) {
      console.error('Error al procesar corte:', err);

      // Extraer el mensaje de error más específico posible
      let errorMessage = 'Error al procesar el corte de faltas';

      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = `Error de red: ${err.message}`;
      }

      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="corte-faltas-container">
        <div className="page-title-container">
          <h1 className="page-title">Corte de Faltas</h1>
          <div className="corte-counter-badge">
            Corte #{conteoCortes}
          </div>
        </div>

      <div className="corte-info-card">
        <h3>¿Qué hace el corte de faltas?</h3>
        <ul>
          <li>📅 Procesa solo días hábiles (Lunes a Viernes)</li>
          <li>❌ Marca faltas automáticamente para días sin asistencia</li>
          <li>🔔 Genera alertas automáticas según el número de faltas</li>
        </ul>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      <div className="corte-form-card">
        <h2>Realizar Corte</h2>

        <div className="corte-summary">
          <div className="summary-item">
            <span className="label">Ciclo Activo:</span>
            <span className="value">
              {ciclos.find(c => (c.id && c.id.toString() === cicloSeleccionado.toString()) || (c.id_ciclo && c.id_ciclo.toString() === cicloSeleccionado.toString()))?.nombre || 'Ninguno'}
            </span>
          </div>
          <div className="summary-item">
            <span className="label">Periodo de Corte:</span>
            <span className="value">
              {fechaInicio ? new Date(fechaInicio).toLocaleDateString('es-MX') : '...'}
              {' - '}
              {fechaFin ? new Date(fechaFin).toLocaleDateString('es-MX') : '...'}
            </span>
          </div>
        </div>

        <div className="form-actions centered">
          <button
            onClick={procesarCorte}
            className="btn btn-danger btn-large"
            disabled={loading || !cicloSeleccionado || !fechaInicio || !fechaFin}
          >
            <Play size={24} />
            {loading ? 'Procesando Corte...' : 'Realizar Corte de Faltas'}
          </button>
        </div>
      </div>

      {reporte && (
        <div className="reporte-card">
          <h2>Reporte de Asistencias</h2>
          <p className="reporte-subtitle">Revisa la información antes de procesar el corte</p>

          <div className="reporte-table-container">
            <table className="reporte-table">
              <thead>
                <tr>
                  <th>Matrícula</th>
                  <th>Estudiante</th>
                  <th>Grupo</th>
                  <th>Días Hábiles</th>
                  <th>Asist. Válidas</th>
                  <th>&lt;10% Perm.</th>
                  <th>Faltas Pend.</th>
                  <th>% Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {reporte.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.matricula}</td>
                    <td>{item.nombre}</td>
                    <td>{item.grupo}</td>
                    <td className="text-center">{item.dias_habiles}</td>
                    <td className="text-center text-success">{item.asistencias_validas}</td>
                    <td className="text-center text-warning">{item.asistencias_menores_10_porciento}</td>
                    <td className="text-center text-danger">{item.faltas_pendientes}</td>
                    <td className="text-center">
                      <span className={`percentage ${item.porcentaje_asistencia >= 80 ? 'good' : item.porcentaje_asistencia >= 60 ? 'warning' : 'bad'}`}>
                        {item.porcentaje_asistencia}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resultado && (
        <div className="resultado-card">
          <div className="resultado-header">
            <CheckCircle size={32} />
            <h2>Corte Procesado Exitosamente</h2>
          </div>

          <div className="resultado-stats">
            <div className="stat-item">
              <span className="stat-label">Días Hábiles</span>
              <span className="stat-value">{resultado.dias_habiles}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Estudiantes Procesados</span>
              <span className="stat-value">{resultado.estudiantes_procesados}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Faltas Nuevas</span>
              <span className="stat-value danger">{resultado.faltas_nuevas}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Asist. &lt;10%</span>
              <span className="stat-value warning">{resultado.asistencias_menores_10_porciento}</span>
            </div>
          </div>

          {resultado.detalles && resultado.detalles.length > 0 && (
            <div className="resultado-detalles">
              <h3>Detalles por Estudiante</h3>
              <ul>
                {resultado.detalles.map((detalle, idx) => (
                  <li key={idx}>
                    <strong>{detalle.nombre}</strong> ({detalle.matricula}):
                    {' '}<span className="text-danger">{detalle.faltas_nuevas} faltas nuevas</span>
                    {detalle.asistencias_menores_10_porciento > 0 && (
                      <>, <span className="text-warning">{detalle.asistencias_menores_10_porciento} asist. &lt;10%</span></>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmar Corte de Faltas"
        size="md"
      >
        <div className="modal-warning-box">
          <AlertTriangle className="flex-shrink-0" size={24} />
          <p className="modal-warning-text">¡Atención! Esta acción es irreversible.</p>
        </div>

        <p className="modal-text">
          Estás a punto de procesar el corte de faltas para el periodo:
        </p>

        <div className="modal-period-display">
          <p className="period-text">
            {fechaInicio ? new Date(fechaInicio).toLocaleDateString('es-MX') : '...'}
            {' - '}
            {fechaFin ? new Date(fechaFin).toLocaleDateString('es-MX') : '...'}
          </p>
        </div>

        <p className="modal-text">
          Al confirmar:
        </p>
        <ul className="modal-list">
          <li>Se calcularán las faltas para todos los estudiantes activos.</li>
          <li>Se registrarán las faltas en el historial.</li>
          <li>Se generarán las alertas correspondientes.</li>
        </ul>

        <div className="modal-actions-custom">
          <button
            onClick={() => setShowConfirmModal(false)}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={confirmarCorte}
            className="btn btn-danger"
          >
            Confirmar y Procesar
          </button>
        </div>
      </Modal>
      </div>
    </PageContainer>
  );
};

export default CorteFaltasPage;
