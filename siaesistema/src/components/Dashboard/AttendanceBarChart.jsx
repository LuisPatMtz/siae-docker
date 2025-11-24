import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AttendanceBarChart = ({ data }) => (
  <div className="attendance-bar-chart">
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 24 }}>
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} tickFormatter={tick => `${tick}%`} />
        <Tooltip formatter={(value) => `${value}%`} />
        <Legend />
        <Bar dataKey="attendance" fill="#2563EB" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default AttendanceBarChart;
