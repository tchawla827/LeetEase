// frontend/src/components/TopicsDashboard.jsx

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'

// Custom tooltip component to style with Tailwind
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white text-sm px-2 py-1 rounded">
        <p className="font-medium">{label}</p>
        <p>{payload[0].value} questions</p>
      </div>
    )
  }
  return null
}

export default function TopicsDashboard({ data, onTagClick }) {
  return (
    <div className="bg-surface border border-gray-800 rounded-code shadow-elevation px-4 py-3">
      <h3 className="text-code-base text-gray-100 font-semibold mb-2 font-mono">
        Top Topics
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 50 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#2d3748" // gray-800 equivalent
          />
          <XAxis
            dataKey="tag"
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ 
              fontSize: '0.8125rem', // text-code-sm
              fill: '#9ca3af', // text-gray-400
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
            }}
          />
          <YAxis
            tick={{
              fontSize: '0.8125rem', // text-code-sm
              fill: '#9ca3af', // text-gray-400
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
            }}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
          />

          <Bar
            dataKey="count"
            fill="#38bdf8" // sky-400
            cursor="pointer"
            onClick={({ payload }) => onTagClick(payload.tag)}
            radius={[4, 4, 0, 0]} // rounded top corners
            className="transition-all duration-150 hover:opacity-80"
          />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-code-xs text-gray-500 italic">
        (Click any bar to filter by that topic)
      </p>
    </div>
  )
}