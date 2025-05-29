// frontend/src/pages/CompanyPage.jsx

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import BucketsTabs from '../components/BucketsTabs'
import QuestionsTable from '../components/QuestionsTable'

// Ensure “All” is the last entry here:
const BUCKET_ORDER = [
  '30Days',
  '3Months',
  '6Months',
  'MoreThan6Months',
  'All'
]

export default function CompanyPage() {
  const { companyName } = useParams()
  const [buckets, setBuckets]               = useState([])
  const [selectedBucket, setSelectedBucket] = useState(null)
  const [showUnsolved, setShowUnsolved]     = useState(false)
  const [searchTerm, setSearchTerm]         = useState('')
  const [refreshKey, setRefreshKey]         = useState(0)

  // Listen for global "leetSync" events to auto-refresh questions
  useEffect(() => {
    const onSync = () => setRefreshKey(k => k + 1)
    window.addEventListener('leetSync', onSync)
    return () => window.removeEventListener('leetSync', onSync)
  }, [])

  // Fetch buckets whenever companyName changes
  useEffect(() => {
    setSelectedBucket(null)
    fetch(`/api/companies/${encodeURIComponent(companyName)}/buckets`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load buckets')
        return res.json()
      })
      .then(raw => {
        // only keep known buckets, and sort by our BUCKET_ORDER
        const filtered = raw
          .filter(name => BUCKET_ORDER.includes(name))
          .sort((a, b) =>
            BUCKET_ORDER.indexOf(a) - BUCKET_ORDER.indexOf(b)
          )
        setBuckets(filtered)
      })
      .catch(console.error)
  }, [companyName])

  return (
    <div style={{ padding: '1rem', height: '100%', overflow: 'auto' }}>
      <h1>{companyName}</h1>

      <div style={{ margin: '0.5rem 0' }}>
        <label>
          <input
            type="checkbox"
            checked={showUnsolved}
            onChange={e => setShowUnsolved(e.target.checked)}
          />{' '}
          Unsolved only
        </label>
      </div>

      <BucketsTabs
        buckets={buckets}
        selected={selectedBucket}
        onSelect={setSelectedBucket}
      />

      {selectedBucket && (
        <>
          <div style={{ margin: '1rem 0', display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search questions…"
              style={{
                flex: 1,
                padding: '0.5rem',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              style={{ padding: '0.5rem 1rem' }}
            >
              Refresh
            </button>
          </div>

          <QuestionsTable
            company={companyName}
            bucket={selectedBucket}
            showUnsolved={showUnsolved}
            searchTerm={searchTerm}
            refreshKey={refreshKey}
          />
        </>
      )}

      {!selectedBucket && buckets.length === 0 && (
        <p>No buckets found for this company.</p>
      )}
    </div>
  )
}
