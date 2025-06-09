import React from 'react'

export default function LinearProgress({ value, className = '', color = 'bg-primary', bgColor = 'bg-gray-800' }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={`w-full ${bgColor} h-2 rounded overflow-hidden ${className}`}>
      <div
        className={`${color} h-full transition-all duration-300`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
