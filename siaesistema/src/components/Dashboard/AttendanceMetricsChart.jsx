// src/components/Dashboard/AttendanceMetricsChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const AttendanceMetricsChart = ({ datos, promedio, periodo, totalEstudiantes }) => {
  if (!datos || datos.length === 0) {
    return (
      <div className="metrics-chart-empty">
        <p>No hay datos de asistencia para este periodo</p>
      </div>
    );
  }

  // Formatear fecha para el eje X
  const formatFecha = (fecha) => {
    const date = new Date(fecha);
    const dia = date.getDate();
    const mes = date.toLocaleDateString('es-MX', { month: 'short' });
    return `${dia} ${mes}`;
  };

  // Tooltip personalizado estilo Facebook
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip-metrics">
          <p className="tooltip-date">{formatFecha(data.fecha)}</p>
          <p className="tooltip-percentage">{data.porcentaje}%</p>
          <p className="tooltip-detail">{data.asistieron} de {data.total} estudiantes</p>
        </div>
      );
    }
    return null;
  };

  // Calcular estadísticas adicionales
  const totalDias = datos.length;
  const diasConAsistencia = datos.filter(d => d.porcentaje > 0).length;
  const mejorDia = datos.reduce((max, d) => d.porcentaje > max.porcentaje ? d : max, datos[0]);
  const peorDia = datos.reduce((min, d) => d.porcentaje < min.porcentaje ? d : min, datos[0]);

  return (
    <div className="attendance-metrics-container">
      {/* Tarjetas de métricas principales estilo Facebook */}
      <div className="metrics-summary-cards">
        <div className="metric-card metric-primary">
          <div className="metric-value">{promedio}%</div>
          <div className="metric-label">Asistencia Promedio</div>
          <div className="metric-sublabel">{totalEstudiantes} estudiantes</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value">{diasConAsistencia}</div>
          <div className="metric-label">Días con asistencia</div>
          <div className="metric-sublabel">de {totalDias} días hábiles</div>
        </div>
        
        <div className="metric-card metric-success">
          <div className="metric-value">{mejorDia.porcentaje}%</div>
          <div className="metric-label">Mejor día</div>
          <div className="metric-sublabel">{formatFecha(mejorDia.fecha)}</div>
        </div>

        <div className="metric-card metric-warning">
          <div className="metric-value">{peorDia.porcentaje}%</div>
          <div className="metric-label">Día más bajo</div>
          <div className="metric-sublabel">{formatFecha(peorDia.fecha)}</div>
        </div>
      </div>

      {/* Gráfico de línea/área estilo Facebook */}
      <div className="metrics-chart-wrapper">
        <h3 className="chart-title">Tendencia de Asistencia</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={datos} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAsistencia" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="fecha" 
              tickFormatter={formatFecha}
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="porcentaje" 
              stroke="#4F46E5" 
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorAsistencia)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla de datos diarios */}
      <div className="metrics-daily-table">
        <h3 className="table-title">Detalle por Día</h3>
        <div className="table-scroll">
          <table className="daily-data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Día</th>
                <th>Asistieron</th>
                <th>Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              {datos.slice().reverse().map((dia, index) => (
                <tr key={index} className={dia.porcentaje === 0 ? 'row-empty' : ''}>
                  <td>{formatFecha(dia.fecha)}</td>
                  <td>{dia.dia_semana}</td>
                  <td>{dia.asistieron} / {dia.total}</td>
                  <td>
                    <div className="percentage-cell">
                      <span className={`percentage-badge ${
                        dia.porcentaje >= 80 ? 'badge-success' :
                        dia.porcentaje >= 50 ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {dia.porcentaje}%
                      </span>
                      <div className="mini-progress">
                        <div 
                          className="mini-progress-fill"
                          style={{ width: `${dia.porcentaje}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceMetricsChart;
