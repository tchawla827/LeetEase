// src/components/Sidebar.js

import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

// Map raw bucket keys (from the API) to human‐friendly labels
const BUCKET_LABELS = {
  '30Days':           '30 Days',
  '3Months':          '3 Months',
  '6Months':          '6 Months',
  'MoreThan6Months':  'More Than 6 Months',
  'All':              'All',
}

export default function Sidebar({ sidebarOpen }) {
  const { user } = useAuth()
  const [filter, setFilter] = useState('')
  const [companies, setCompanies] = useState([])
  const [expandedCompanies, setExpandedCompanies] = useState({})
  const [bucketsByCompany, setBucketsByCompany] = useState({})

  const location = useLocation()
  const navigate = useNavigate()

  // Extract active company slug from URL (e.g. “Adobe” in /company/Adobe?bucket=…)
  const activeCompany = decodeURIComponent(
    (location.pathname.split('/company/')[1] || '').split('/')[0]
  )

  // 1) Load the list of all companies on mount (and whenever user changes)
  useEffect(() => {
    if (!user) {
      setCompanies([])
      return
    }
    api
      .get('/api/companies')
      .then(res => setCompanies(res.data))
      .catch(err => console.error('Failed to load companies', err))
  }, [user])

  // 2) Toggle “expanded” state for a company; if expanding, fetch buckets
  const toggleCompany = company => {
    setExpandedCompanies(prev => {
      const nowExpanded = !prev[company]

      // If we’re expanding and haven’t fetched buckets yet, fetch them now:
      if (nowExpanded && !bucketsByCompany[company]) {
        fetchBucketsForCompany(company)
      }

      return {
        ...prev,
        [company]: nowExpanded,
      }
    })
  }

  // Fetch “/api/companies/:company/buckets” and store result in state
  const fetchBucketsForCompany = company => {
    api
      .get(`/api/companies/${encodeURIComponent(company)}/buckets`)
      .then(res => {
        // Backend returns raw keys, e.g. ["30Days","6Months","All"]
        // Sort them in a consistent order:
        const BUCKET_ORDER = ['30Days', '3Months', '6Months', 'MoreThan6Months', 'All']
        const raw = res.data
          .filter(b => BUCKET_ORDER.includes(b))
          .sort((a, b) => BUCKET_ORDER.indexOf(a) - BUCKET_ORDER.indexOf(b))

        setBucketsByCompany(prev => ({
          ...prev,
          [company]: raw,
        }))
      })
      .catch(err => {
        console.error(`Failed to load buckets for ${company}`, err)
        // If the request fails, store an empty array so we don’t keep retrying
        setBucketsByCompany(prev => ({
          ...prev,
          [company]: [],
        }))
      })
  }

  // 3) When user clicks a bucket, navigate to /company/:company?bucket=<rawBucketName>
  const handleBucketClick = (company, rawBucketName) => {
    navigate(
      `/company/${encodeURIComponent(company)}?bucket=${encodeURIComponent(rawBucketName)}`
    )
  }

  // 4) Filter companies by prefix for the “Search companies…” input
  const prefix = filter.trim().toLowerCase()
  const filteredCompanies =
    prefix === ''
      ? companies
      : companies.filter(c => c.toLowerCase().startsWith(prefix))

  return (
    <>
      {user && (
        <aside
          className={`
            transform transition-transform duration-200 ease-in-out
            w-64 bg-surface border-r border-gray-800 shadow-elevation overflow-y-auto px-card py-2

            /* Slide on mobile */
            fixed top-0 left-0 bottom-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}

            /* On desktop: show/hide via block/hidden */
            ${sidebarOpen ? 'md:relative md:block' : 'md:hidden'}
          `}
        >
          <h2 className="font-mono text-code-base text-gray-100 mb-2">Companies</h2>

          <input
            type="text"
            placeholder="Search companies…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="font-mono text-code-sm w-full px-3 py-1.5 mb-2 rounded-code border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />

          <ul className="space-y-1">
            {filteredCompanies.map(company => {
              const isActive = company === activeCompany
              const isExpanded = Boolean(expandedCompanies[company])
              const buckets = bucketsByCompany[company] || []

              return (
                <li key={company} className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/company/${encodeURIComponent(company)}`}
                      className={`font-mono text-code-base ${
                        isActive ? 'text-primary font-medium' : 'text-gray-300'
                      } hover:text-primary transition-colors duration-150`}
                    >
                      {company}
                    </Link>
                    <button
                      onClick={() => toggleCompany(company)}
                      className="text-gray-400 hover:text-primary p-1 transition-colors duration-150"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? '−' : '+'}
                    </button>
                  </div>

                  {isExpanded && (
                    <ul className="ml-4 mt-1 space-y-1 border-l border-gray-700 pl-2">
                      {/* While waiting for the API, show a “Loading…” placeholder */}
                      {bucketsByCompany[company] === undefined ? (
                        <li className="font-mono text-code-sm text-gray-500 px-2 py-1">
                          Loading…
                        </li>
                      ) : buckets.length > 0 ? (
                        buckets.map(rawBucketName => (
                          <li key={rawBucketName}>
                            <button
                              onClick={() =>
                                handleBucketClick(company, rawBucketName)
                              }
                              className="font-mono text-code-sm text-gray-400 hover:text-primary hover:bg-gray-800 w-full text-left px-2 py-1 rounded-code transition-colors duration-150"
                            >
                              {BUCKET_LABELS[rawBucketName] || rawBucketName}
                            </button>
                          </li>
                        ))
                      ) : (
                        <li className="font-mono text-code-sm text-gray-500 px-2 py-1">
                          (No buckets)
                        </li>
                      )}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </aside>
      )}
    </>
  )
}
