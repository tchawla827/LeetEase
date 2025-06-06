import React, { useEffect, useState } from 'react'
import { fetchUserStats } from '../api'

export default function CompanyStats() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserStats()
      .then(res => setCompanies(res.data.companies || []))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="font-mono text-code-sm text-gray-500 italic">Loading company stats…</div>
    )
  }

  if (!companies.length) {
    return (
      <div className="font-mono text-code-sm text-gray-500 italic">No company stats.</div>
    )
  }

  return (
    <ul className="text-sm space-y-1 max-h-60 overflow-y-auto pr-1">
      {companies.map(c => (
        <li key={c.company} className="flex justify-between">
          <span>{c.company}</span>
          <span>{c.solved} / {c.total}</span>
        </li>
      ))}
    </ul>
  )
}

