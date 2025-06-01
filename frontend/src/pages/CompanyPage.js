// frontend/src/pages/CompanyPage.js

import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import BucketsTabs from '../components/BucketsTabs'
import QuestionsTable from '../components/QuestionsTable'
import TopicsDashboard from '../components/TopicsDashboard'
import CompanyProgress from '../components/CompanyProgress'
import { fetchCompanyProgress } from '../api'

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

  // --- company-progress state + loading flag ---
  const [progressData, setProgressData]   = useState([])
  const [loadingProgress, setLoadingProgress] = useState(true)

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

  // ── Fetch company-progress when companyName changes ────────────────────
  useEffect(() => {
    if (!companyName) return
    setLoadingProgress(true)
    fetchCompanyProgress(companyName)
      .then(res => {
        setProgressData(res.data || [])
      })
      .catch(err => {
        console.error('Failed to load company progress', err)
        setProgressData([])
      })
      .finally(() => setLoadingProgress(false))
  }, [companyName])

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
    <div className="px-4 py-6 md:px-6 max-w-6xl mx-auto h-full overflow-auto">
      <h1 className="text-2xl font-mono text-gray-100 mb-4">{companyName}</h1>

      {/* ── Render company-progress widget ─────────────────────────────────── */}
      <CompanyProgress data={progressData} loading={loadingProgress} />

      <div className="flex items-center mb-4">
        <label className="flex items-center text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            className="form-checkbox h-4 w-4 text-primary rounded-code focus:ring-primary border-gray-600 bg-gray-800"
            checked={showUnsolved}
            onChange={e => setShowUnsolved(e.target.checked)}
          />
          <span className="ml-2">Unsolved only</span>
        </label>
      </div>

      {/* only render tabs when we've got our bucket list */}
      {bucketsLoading ? (
        <div className="text-sm text-gray-500 italic">Loading buckets...</div>
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
        <p className="text-gray-400">No buckets found for this company.</p>
      )}

      {/* once we have a selectedBucket, show search / table / analytics */}
      {selectedBucket && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search questions..."
              className="flex-1 px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-code placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => {
                setRefreshKey(k => k + 1)
                setSelectedTag(null)
              }}
              className="px-4 py-2 bg-gray-800 text-gray-100 rounded-code hover:bg-gray-700 transition"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowAnalytics(a => !a)}
              className="px-4 py-2 bg-gray-800 text-gray-100 rounded-code hover:bg-gray-700 transition"
            >
              {showAnalytics ? 'Back to Questions' : 'Show Analytics'}
            </button>
          </div>

          {showAnalytics ? (
            loadingTopics ? (
              <div className="text-sm text-gray-500 italic">Loading analytics...</div>
            ) : (
              <div className="rounded-xl bg-surface border border-gray-800 shadow-elevation p-4 mb-4">
                <TopicsDashboard
                  data={topics}
                  onTagClick={tag => {
                    setSelectedTag(tag)
                    setShowAnalytics(false)
                  }}
                />
              </div>
            )
          ) : (
            <>
              {selectedTag && (
                <div className="text-sm text-gray-400 mb-2">
                  <strong>Filtered by topic:</strong> {selectedTag}{' '}
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="ml-2 text-blue-400 hover:underline text-sm"
                  >
                    Clear
                  </button>
                </div>
              )}
              <div className="rounded-xl bg-surface border border-gray-800 shadow-elevation p-4">
                <QuestionsTable
                  key={refreshKey}
                  company={companyName}
                  bucket={selectedBucket}
                  showUnsolved={showUnsolved}
                  searchTerm={searchTerm}
                  tagFilter={selectedTag}
                  refreshKey={refreshKey}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}