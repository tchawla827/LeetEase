import React from 'react'

export default function CircularProgress({
  size = 80,
  stroke = 8,
  progress = 0,
  color = 'rgb(var(--color-primary))',
  bg = 'rgb(var(--color-gray-300))',
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={bg}
        strokeWidth={stroke}
        fill="transparent"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  )
}
