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

export default function TopicsDashboard({ data, onTagClick }) {
  return (
    <div className="p-4 bg-white rounded-xl shadow">
      <h3 className="text-xl font-semibold mb-2">Top Topics</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="tag"
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          <Tooltip />

          <Bar
            dataKey="count"
            fill="#000"
            cursor="pointer"
            // Recharts onClick: first arg is an object with .payload
            onClick={({ payload }) => onTagClick(payload.tag)}
            background={{
              fill: 'transparent',
              cursor: 'pointer',
              // if you really want clicking the background to work too:
              // onClick: ({ payload }) => onTagClick(payload.tag)
            }}
          />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-sm text-gray-600">
        (Click anywhere in a column to filter by that topic)
      </p>
    </div>
  )
}
