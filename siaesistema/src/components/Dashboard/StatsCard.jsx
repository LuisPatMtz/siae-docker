// src/components/Dashboard/StatsCard.jsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ["#2563EB", "#60A5FA", "#1E40AF", "#3B82F6", "#6366F1", "#0EA5E9", "#818CF8"];

const StatsCard = ({ title, totalStudents, averageAttendance, groupStats }) => {
  // groupStats: [{ name: 'Grupo 1', value: 20 }, ...]
  return (
    <div className="card stats-card">
      <h2 className="card-title">{title}</h2>
      <div className="stats-pie-container">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={groupStats}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={45}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {groupStats.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value} integrantes`, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="stats-pie-labels">
          <span className="stats-circle-label">Total de Estudiantes: {totalStudents.toLocaleString('es-MX')}</span>
          <span className="stats-circle-sublabel">Asistencia Promedio: {averageAttendance.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;