import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const DonutProgressChart = ({ 
  percentage, 
  size = 80, 
  strokeWidth = 8, 
  activeColor = '#4F46E5', // Indigo-600
  inactiveColor = '#E5E7EB', // Gray-200
  textColor = '#1F2937' // Gray-800
}) => {
  const data = [
    { name: 'Completed', value: percentage },
    { name: 'Remaining', value: 100 - percentage },
  ];
  const COLORS = [activeColor, inactiveColor];

  // Ensure percentage is within 0-100
  const validPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div style={{ width: size, height: size, position: 'relative', margin: '0 auto' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size / 2 - strokeWidth}
            outerRadius={size / 2}
            fill="#8884d8"
            paddingAngle={0}
            dataKey="value"
            startAngle={90}
            endAngle={-270} // Fills clockwise from top
            stroke="none" // No border between segments
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: textColor,
          fontSize: Math.max(10, size / 4.5) + 'px',
          fontWeight: '600',
        }}
      >
        {`${Math.round(validPercentage)}%`}
      </div>
    </div>
  );
};

export default DonutProgressChart; 