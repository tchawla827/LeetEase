// frontend/src/pages/CompanyPage.js

import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
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
  const [searchParams, setSearchParams] = useSearchParams()

  // pull URL params once
  const bucketFromUrl    = searchParams.get('bucket')
  const tagFromUrl       = searchParams.get('tag')
  const unsolvedFromUrl  = searchParams.get('unsolved') === 'true'
  const qFromUrl         = searchParams.get('q') || ''

  // --- filter & drill-down state (bootstrapped from URL) ---
  const [selectedBucket, setSelectedBucket] = useState(() => bucketFromUrl || null)
  const [selectedTag, setSelectedTag]       = useState(() => tagFromUrl || null)
  const [showUnsolved, setShowUnsolved]     = useState(() => unsolvedFromUrl)
  const [searchTerm, setSearchTerm]         = useState(() => qFromUrl)

  // --- buckets + loading flag ---
  const [buckets, setBuckets]         = useState([])
  const [bucketsLoading, setBucketsLoading] = useState(true)

  // --- other UI state ---
  const [refreshKey, setRefreshKey]       = useState(0)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [topics, setTopics]               = useState([])
  const [loadingTopics, setLoadingTopics] = useState(false)

  // keep URL in sync
  useEffect(() => {
    const params = {}
    if (selectedBucket) params.bucket   = selectedBucket
    if (selectedTag)    params.tag      = selectedTag
    if (showUnsolved)   params.unsolved = 'true'
    if (searchTerm)     params.q        = searchTerm
    setSearchParams(params, { replace: true })
  }, [selectedBucket, selectedTag, showUnsolved, searchTerm, setSearchParams])

  // global refresh listener
  useEffect(() => {
    const onSync = () => setRefreshKey(k => k + 1)
    window.addEventListener('leetSync', onSync)
    return () => window.removeEventListener('leetSync', onSync)
  }, [])

  // fetch buckets when company (or bucketFromUrl) changes
  useEffect(() => {
    setBucketsLoading(true)
    setBuckets([])

    fetch(`/api/companies/${encodeURIComponent(companyName)}/buckets`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load buckets')
        return res.json()
      })
      .then(raw => {
        const filtered = raw
          .filter(name => BUCKET_ORDER.includes(name))
          .sort((a, b) => BUCKET_ORDER.indexOf(a) - BUCKET_ORDER.indexOf(b))
        setBuckets(filtered)

        // pick initial bucket: URL → localStorage → first
        if (bucketFromUrl && filtered.includes(bucketFromUrl)) {
          setSelectedBucket(bucketFromUrl)
        } else {
          const key = `leetBucket:${companyName}`
          const stored = localStorage.getItem(key)
          if (stored && filtered.includes(stored)) {
            setSelectedBucket(stored)
          } else if (filtered.length > 0) {
            setSelectedBucket(filtered[0])
          } else {
            setSelectedBucket(null)
          }
        }
      })
      .catch(console.error)
      .finally(() => setBucketsLoading(false))
  }, [companyName, bucketFromUrl])

  // fetch analytics when toggled on
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
      .catch(console.error)
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

      {/* only render tabs when we've got our bucket list */}
      {bucketsLoading ? (
        <div>Loading buckets…</div>
      ) : buckets.length > 0 ? (
        <BucketsTabs
          buckets={buckets}
          selected={selectedBucket}
          onSelect={bucket => {
            setSelectedBucket(bucket)
            localStorage.setItem(`leetBucket:${companyName}`, bucket)
            setShowAnalytics(false)
            setSelectedTag(null)
          }}
        />
      ) : (
        <p>No buckets found for this company.</p>
      )}

      {/* once we have a selectedBucket, show search / table / analytics */}
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
              onClick={() => {
                setRefreshKey(k => k + 1)
                setSelectedTag(null)
              }}
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
            loadingTopics ? (
              <div>Loading analytics…</div>
            ) : (
              <TopicsDashboard
                data={topics}
                onTagClick={tag => {
                  setSelectedTag(tag)
                  setShowAnalytics(false)
                }}
              />
            )
          ) : (
            <>
              {selectedTag && (
                <div style={{ margin: '0.5rem 0' }}>
                  <strong>Filtered by topic:</strong> {selectedTag}{' '}
                  <button
                    onClick={() => setSelectedTag(null)}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    Clear
                  </button>
                </div>
              )}
              <QuestionsTable
                key={refreshKey}
                company={companyName}
                bucket={selectedBucket}
                showUnsolved={showUnsolved}
                searchTerm={searchTerm}
                tagFilter={selectedTag}
                refreshKey={refreshKey}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
