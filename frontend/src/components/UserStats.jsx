import React, { useEffect, useState } from 'react'
import CircularProgress from './CircularProgress'
import { fetchUserStats } from '../api'
import Loading from './Loading'

export default function UserStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserStats()
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <Loading message="Loading stats…" />
  }

  if (!stats) {
    return (
      <div className="font-mono text-code-sm text-gray-500 italic">Stats unavailable.</div>
    )
  }

  const { totalSolved, totalQuestions, difficulty } = stats

  const totalQs = typeof totalQuestions === 'number' ? totalQuestions : 0

  const pct = totalQs > 0 ? Math.round((totalSolved / totalQs) * 100) : 0

  const diffColors = { Easy: '#8BC34A', Medium: '#FFB74D', Hard: '#E57373' }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="relative">
          <CircularProgress size={120} progress={pct} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">

            <span className="text-xl font-medium">{totalSolved}/{totalQs}</span>

            <span className="text-gray-400 text-sm">Solved</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {['Easy', 'Medium', 'Hard'].map(level => (
          <div key={level} className="flex flex-col items-center">
            <span className="text-lg font-medium" style={{ color: diffColors[level] }}>
              {difficulty[level] || 0}
            </span>
            <span className="text-gray-400 text-sm">{level}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
