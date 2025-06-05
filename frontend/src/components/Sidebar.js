// src/components/Sidebar.js

import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

// Map raw bucket keys (from the API) to human-friendly labels
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
  // Currently selected bucket from the query string
  const activeBucket = new URLSearchParams(location.search).get('bucket')

  // ─── 1) Load the list of all companies on mount (and whenever user changes) ───
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

  // ─── 2) Toggle “expanded” state for a company; if expanding, fetch buckets ────
  const toggleCompany = company => {
    setExpandedCompanies(prev => {
      const nowExpanded = !prev[company]
      if (nowExpanded && bucketsByCompany[company] === undefined) {
        fetchBucketsForCompany(company)
      }
      return {
        ...prev,
        [company]: nowExpanded,
      }
    })
  }

  // Ensure a company is expanded (fetching buckets if needed)
  const openCompany = company => {
    setExpandedCompanies(prev => {
      if (!prev[company] && bucketsByCompany[company] === undefined) {
        fetchBucketsForCompany(company)
      }
      return { ...prev, [company]: true }
    })
  }

  // ─── 3) Fetch “/api/companies/:company/buckets” and store result ─────────────
  const fetchBucketsForCompany = company => {
    api
      .get(`/api/companies/${encodeURIComponent(company)}/buckets`)
      .then(res => {
        // Order buckets consistently
        const BUCKET_ORDER = [
          '30Days', '3Months', '6Months', 'MoreThan6Months', 'All'
        ]
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
        setBucketsByCompany(prev => ({
          ...prev,
          [company]: [],
        }))
      })
  }

  // ─── 4) On bucket click, navigate to /company/:company?bucket=<rawBucketName> ───
  const handleBucketClick = (company, rawBucketName) => {
    navigate(
      `/company/${encodeURIComponent(company)}?bucket=${encodeURIComponent(
        rawBucketName
      )}`
    )
  }

  // Navigate to a company and expand its bucket list
  const handleCompanyClick = company => {
    openCompany(company)
    navigate(`/company/${encodeURIComponent(company)}`)
  }

  // ─── 5) Filter companies by prefix for the “Search companies…” input ─────────
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
            /* ───────────────────────────────────────────────────────── */
            /* On mobile (< md): fixed sidebar under Navbar */
            fixed top-16 left-0 bottom-0 z-50

            /* On desktop (>= md): static in-flow sidebar */
            md:relative md:top-0 md:block

            /* Basic styling */
            bg-gradient-to-b from-surface via-gray-900 to-surface
            border-r border-gray-800 shadow-elevation
            overflow-y-auto sidebar-scroll

            transform transition-all duration-300
            ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}
            /* ───────────────────────────────────────────────────────── */
          `}
        >
          {/*
            ── “pt-2 px-card” ensures:
               • On mobile, the “Companies” heading sits just below the Navbar.
               • On desktop, parent already has pt-16, so this is extra padding.
          */}
          <div className="pt-2 px-card">
            <h2 className="font-mono text-lg md:text-xl text-gray-100 font-semibold mb-3">
              Companies
            </h2>

            <input
              type="text"
              placeholder="Search companies…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="
                font-mono text-code-sm w-full px-3 py-1.5 mb-2
                rounded-code border border-gray-700 bg-gray-900
                text-gray-100 placeholder-gray-500
                focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50
              "
            />

            <ul className="divide-y divide-gray-800">
              {filteredCompanies.map(company => {
                const isActive = company === activeCompany
                const isExpanded = Boolean(expandedCompanies[company])
                const buckets = bucketsByCompany[company]

                return (
                  <li key={company} className="flex flex-col">
                    <button
                      onClick={() => handleCompanyClick(company)}
                      className={`
                        group flex items-center justify-between w-full rounded-md px-2 py-2 text-left
                        transition-colors duration-150
                        ${
                          isActive
                            ? 'bg-gray-700 border-l-4 border-primary text-primary font-medium'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }
                      `}
                    >
                      <span className="flex-1 font-mono text-code-base">{company}</span>
                      <span
                        role="button"
                        onClick={e => {
                          e.stopPropagation()
                          toggleCompany(company)
                        }}
                        className="text-gray-400 group-hover:text-primary p-1 rounded transition-colors duration-150 hover:bg-gray-800/40"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? '−' : '+'}
                      </span>
                    </button>

                    {isExpanded && (
                      <ul className="ml-4 mt-1 space-y-1 border-l border-gray-700 pl-2">
                        {buckets === undefined ? (
                          <li className="font-mono text-code-sm text-gray-500 px-2 py-1">
                            Loading…
                          </li>
                        ) : buckets.length > 0 ? (
                          buckets.map(rawBucketName => {
                            const bucketActive =
                              isActive && activeBucket === rawBucketName
                            return (
                              <li key={rawBucketName}>
                                <button
                                  onClick={() =>
                                    handleBucketClick(company, rawBucketName)
                                  }
                                  className={`
                                    font-mono text-code-sm rounded-code w-full text-left px-2 py-1
                                    transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-primary/50
                                    ${bucketActive
                                      ? 'bg-primary/20 text-primary font-semibold ring-1 ring-primary/50'
                                      : 'text-gray-400 hover:text-primary hover:bg-gray-800/60'}
                                  `}
                                >
                                  {BUCKET_LABELS[rawBucketName] || rawBucketName}
                                </button>
                              </li>
                            )
                          })
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
          </div>
        </aside>
      )}
    </>
  )
}
