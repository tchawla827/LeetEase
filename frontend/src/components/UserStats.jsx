import React from 'react'
import CircularProgress from './CircularProgress'
import Loading from './Loading'
import useUserStats from '../context/useUserStats'

export default function UserStats() {
  const { stats, loading } = useUserStats()

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

  const difficultyData = [
    { level: 'Easy', color: '#10B981', bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/20' },
    { level: 'Medium', color: '#F59E0B', bgClass: 'bg-amber-500/10 dark:bg-amber-500/20' },
    { level: 'Hard', color: '#EF4444', bgClass: 'bg-red-500/10 dark:bg-red-500/20' }
  ]

  return (
    <div className="bg-surface rounded-xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Your Progress</h3>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Live</span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <CircularProgress size={140} progress={pct} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{pct}%</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Complete</span>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {totalSolved} <span className="text-base font-normal text-gray-500 dark:text-gray-400">of {totalQs}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Problems Solved</p>
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Difficulty Breakdown</h4>
        {difficultyData.map(({ level, color, bgClass }) => {
          const solved = difficulty[level] || 0
          const total = totalQs > 0 ? Math.round(totalQs / 3) : 0 // Approximate distribution
          const levelPct = total > 0 ? Math.round((solved / total) * 100) : 0
          
          return (
            <div key={level} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-md ${bgClass}`}>
                    <span className="text-xs font-medium" style={{ color }}>{level}</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{solved} solved</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{levelPct}%</span>
              </div>
              <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${levelPct}%`, 
                    backgroundColor: color,
                    opacity: 0.8
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Motivational Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          {pct >= 75 ? '🔥 You\'re on fire! Keep it up!' : 
           pct >= 50 ? '💪 Great progress! Stay consistent!' : 
           pct >= 25 ? '🚀 Nice start! Keep solving!' : 
           '✨ Every expert was once a beginner!'}
        </p>
      </div>
    </div>
  )
}