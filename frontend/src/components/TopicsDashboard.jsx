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
            onClick={({ tag }) => onTagClick(tag)}
            cursor="pointer"
          />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-sm text-gray-600">
        (Click a bar to view questions for that topic)
      </p>
    </div>
  )
}
