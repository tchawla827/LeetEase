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
      <div className="font-mono text-code-sm text-gray-500 italic">No company stats.</div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Search companies…"
          className="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-code text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex items-center">
          <label className="text-xs text-gray-600 dark:text-gray-400 mr-2" htmlFor="company-sort">
            Sort by
          </label>
          <select
            id="company-sort"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-code text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="name">Name</option>
            <option value="solved">% Solved</option>
            <option value="unsolved">% Unsolved</option>
          </select>
        </div>
      </div>

      <ul className="text-sm space-y-3 max-h-72 overflow-y-auto pr-1">
        {sorted.map(c => {
          const pctSolved = c.total ? Math.round((c.solved / c.total) * 100) : 0
          return (
            <li key={c.company} className="space-y-1">
              <div className="flex justify-between items-center">
                <Link
                  to={`/company/${encodeURIComponent(c.company)}`}
                  className="text-primary hover:underline"
                >
                  {c.company}
                </Link>
                <span className="text-gray-600 dark:text-gray-400">
                  {c.solved} / {c.total}
                </span>
              </div>
              <LinearProgress value={pctSolved} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

