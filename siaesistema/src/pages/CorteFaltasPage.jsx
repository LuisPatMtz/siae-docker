// src/pages/CorteFaltasPage.jsx
import React, { useState, useEffect } from 'react';
import { cyclesApi } from '../api/cyclesApi';
import { faultsApi } from '../api/faultsApi';
import { Calendar, CheckCircle, AlertTriangle, FileText, Play } from 'lucide-react';
import '../styles/corte-faltas.css';

const CorteFaltasPage = () => {
  const [ciclos, setCiclos] = useState([]);
  const [cicloSeleccionado, setCicloSeleccionado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [diasHabiles, setDiasHabiles] = useState(null);
  const [reporte, setReporte] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        setCicloSeleccionado(cicloActivo.id_ciclo.toString());
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

  const procesarCorte = async () => {
    if (!cicloSeleccionado || !fechaInicio || !fechaFin) {
      setError('Completa todos los campos requeridos');
      return;
    }

    if (!window.confirm('¿Estás seguro de procesar el corte de faltas? Esta acción registrará las faltas de forma automática.')) {
      return;
    }

    setLoading(true);
    setError('');
    setReporte(null);

    try {
      const data = await faultsApi.procesarCorte(
        parseInt(cicloSeleccionado),
        fechaInicio,
        fechaFin
      );
      setResultado(data);
      alert('Corte de faltas procesado exitosamente');
    } catch (err) {
      console.error('Error al procesar corte:', err);
      setError(err.response?.data?.detail || 'Error al procesar el corte de faltas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="corte-faltas-container">
      <div className="page-title-container">
        <h1 className="page-title">Corte de Faltas</h1>
      </div>

      <div className="corte-info-card">
        <h3>¿Qué hace el corte de faltas?</h3>
        <ul>
          <li>📅 Procesa solo días hábiles (Lunes a Viernes)</li>
          <li>⏱️ Las asistencias con menos del 10% de permanencia no cuentan</li>
          <li>❌ Marca faltas automáticamente para días sin asistencia válida</li>
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
        <h2>Configuración del Corte</h2>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Ciclo Escolar *</label>
            <select
              value={cicloSeleccionado}
              onChange={(e) => setCicloSeleccionado(e.target.value)}
              className="form-input"
            >
              <option value="">Selecciona un ciclo</option>
              {ciclos.map(ciclo => (
                <option key={ciclo.id} value={ciclo.id}>
                  {ciclo.nombre} {ciclo.activo ? '(Activo)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Fecha de Inicio *</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setDiasHabiles(null);
              }}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Fecha de Fin *</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value);
                setDiasHabiles(null);
              }}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-actions">
          <button 
            onClick={calcularDiasHabiles}
            className="btn btn-secondary"
            disabled={!fechaInicio || !fechaFin}
          >
            <Calendar size={18} />
            Calcular Días Hábiles
          </button>

          <button 
            onClick={generarReporte}
            className="btn btn-info"
            disabled={loading || !fechaInicio || !fechaFin}
          >
            <FileText size={18} />
            {loading ? 'Generando...' : 'Ver Reporte Previo'}
          </button>

          <button 
            onClick={procesarCorte}
            className="btn btn-danger"
            disabled={loading || !cicloSeleccionado || !fechaInicio || !fechaFin}
          >
            <Play size={18} />
            {loading ? 'Procesando...' : 'Procesar Corte'}
          </button>
        </div>
      </div>

      {diasHabiles && (
        <div className="dias-habiles-card">
          <h3>
            <Calendar size={20} />
            Días Hábiles en el Periodo
          </h3>
          <div className="dias-info">
            <span className="dias-count">{diasHabiles.total_dias_habiles}</span>
            <span className="dias-label">días hábiles</span>
          </div>
          <p className="dias-rango">
            Del {new Date(diasHabiles.fecha_inicio).toLocaleDateString('es-MX')} 
            {' '}al {new Date(diasHabiles.fecha_fin).toLocaleDateString('es-MX')}
          </p>
        </div>
      )}

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
    </div>
  );
};

export default CorteFaltasPage;
