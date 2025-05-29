// frontend/src/pages/CompanyPage.jsx

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import BucketsTabs from '../components/BucketsTabs'
import QuestionsTable from '../components/QuestionsTable'
import TopicsDashboard from '../components/TopicsDashboard'

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

  // analytics state
  const [showAnalytics, setShowAnalytics]   = useState(false)
  const [topics, setTopics]                 = useState([])
  const [loadingTopics, setLoadingTopics]   = useState(false)

  // Listen for global "leetSync" events to auto-refresh questions
  useEffect(() => {
    const onSync = () => setRefreshKey(k => k + 1)
    window.addEventListener('leetSync', onSync)
    return () => window.removeEventListener('leetSync', onSync)
  }, [])

  // Fetch available buckets when company changes
  useEffect(() => {
    setSelectedBucket(null)
    fetch(`/api/companies/${encodeURIComponent(companyName)}/buckets`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load buckets')
        return res.json()
      })
      .then(raw => {
        const filtered = raw
          .filter(name => BUCKET_ORDER.includes(name))
          .sort((a, b) =>
            BUCKET_ORDER.indexOf(a) - BUCKET_ORDER.indexOf(b)
          )
        setBuckets(filtered)
      })
      .catch(console.error)
  }, [companyName])

  // Fetch topic analytics when toggled on, a bucket is selected, or the "unsolved" filter changes
  useEffect(() => {
    if (!showAnalytics || !selectedBucket) return

    setLoadingTopics(true)
    fetch(
      `/api/companies/${encodeURIComponent(companyName)}` +
      `/topics?bucket=${encodeURIComponent(selectedBucket)}` +
      `&unsolved=${showUnsolved}`
    )
      .then(res => {
        if (!res.ok) throw new Error('Failed to load analytics')
        return res.json()
      })
      .then(json => setTopics(json.data))
      .catch(err => console.error(err))
      .finally(() => setLoadingTopics(false))
  }, [companyName, showAnalytics, selectedBucket, showUnsolved])

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
        onSelect={bucket => {
          setSelectedBucket(bucket)
          setShowAnalytics(false)  // reset analytics view on bucket change
        }}
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
            <button
              onClick={() => setShowAnalytics(a => !a)}
              style={{ padding: '0.5rem 1rem' }}
            >
              {showAnalytics ? 'Back to Questions' : 'Show Analytics'}
            </button>
          </div>

          {showAnalytics ? (
            loadingTopics
              ? <div>Loading analytics…</div>
              : <TopicsDashboard data={topics} />
          ) : (
            <QuestionsTable
              key={refreshKey}
              company={companyName}
              bucket={selectedBucket}
              showUnsolved={showUnsolved}
              searchTerm={searchTerm}
              refreshKey={refreshKey}
            />
          )}
        </>
      )}

      {!selectedBucket && buckets.length === 0 && (
        <p>No buckets found for this company.</p>
      )}
    </div>
  )
}
