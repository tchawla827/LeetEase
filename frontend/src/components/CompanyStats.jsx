import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import LinearProgress from './LinearProgress'
import Loading from './Loading'
import useUserStats from '../context/useUserStats'

export default function CompanyStats() {
  const { stats, loading } = useUserStats()
  const companies = stats?.companies || []
  const [sortBy, setSortBy] = useState('name')
  const [filter, setFilter] = useState('')

  const sorted = useMemo(() => {
    const list = [...companies]
    switch (sortBy) {
      case 'solved':
        list.sort((a, b) => {
          const aPct = a.total ? a.solved / a.total : 0
          const bPct = b.total ? b.solved / b.total : 0
          return bPct - aPct
        })
        break
      case 'unsolved':
        list.sort((a, b) => {
          const aPct = a.total ? (a.total - a.solved) / a.total : 0
          const bPct = b.total ? (b.total - b.solved) / b.total : 0
          return bPct - aPct
        })
        break
      default:
        list.sort((a, b) => a.company.localeCompare(b.company))
    }

    const prefix = filter.trim().toLowerCase()
    if (prefix) {
      return list.filter(c => c.company.toLowerCase().startsWith(prefix))
    }
    return list
  }, [companies, sortBy, filter])

  if (loading) {
    return <Loading message="Loading company stats…" />
  }

  if (!companies.length) {
    return (
      <div className="bg-surface rounded-card p-6 border border-gray-300 dark:border-gray-800 shadow-elevation">
        <p className="text-center text-muted text-sm">No company stats available yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-card border border-gray-300 dark:border-gray-800 shadow-elevation p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1 max-w-xs">
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Search companies…"
            className="w-full bg-background border border-gray-300 dark:border-gray-700 text-foreground rounded-lg px-4 py-2.5 text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:border-gray-400 dark:hover:border-gray-600"
          />
        </div>
        <div className="flex items-center gap-3">
          <label 
            className="text-sm font-medium text-muted whitespace-nowrap" 
            htmlFor="company-sort"
          >
            Sort by
          </label>
          <select
            id="company-sort"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-background border border-gray-300 dark:border-gray-700 text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer hover:border-gray-400 dark:hover:border-gray-600"
          >
            <option value="name">Name</option>
            <option value="solved">% Solved</option>
            <option value="unsolved">% Unsolved</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
          {sorted.length} {sorted.length === 1 ? 'Company' : 'Companies'}
        </h3>
        <ul className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          {sorted.map(c => {
            const pctSolved = c.total ? Math.round((c.solved / c.total) * 100) : 0
            return (
              <li key={c.company}>
                <Link
                  to={`/company/${encodeURIComponent(c.company)}`}
                  className="group block bg-background rounded-lg p-4 border border-gray-200 dark:border-gray-800 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-primary font-medium group-hover:text-primary-hover group-hover:underline decoration-2 underline-offset-2 transition-all duration-200">
                      {c.company}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                        {c.solved}
                      </span>
                      <span className="text-sm text-muted">/</span>
                      <span className="text-sm text-muted">
                        {c.total}
                      </span>
                      <span className="text-xs font-medium text-muted ml-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded group-hover:bg-primary/10 group-hover:text-primary transition-all duration-200">
                        {pctSolved}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="group-hover:scale-[1.02] transition-transform duration-200 origin-left">
                      <LinearProgress value={pctSolved} />
                    </div>
                    <div className="flex justify-between text-xs text-muted group-hover:text-muted/80 transition-colors duration-200">
                      <span>{c.solved} solved</span>
                      <span>{c.total - c.solved} remaining</span>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}