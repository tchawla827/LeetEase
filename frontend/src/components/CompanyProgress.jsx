// frontend/src/components/CompanyProgress.jsx

import React from 'react'
import PropTypes from 'prop-types'
import Loading from './Loading'

/**
 * Expects props.data to be an array of:
 *   { bucket: "30Days", total: 12, solved: 7 }
 * Renders a horizontal bar (or text) for each bucket showing "solved/total (XX%)".
 * **Skips any bucket where total === 0.**
 */
export default function CompanyProgress({ data, loading }) {
  if (loading) {
    return <Loading message="Loading progress…" />
  }

  // Filter out any bucket with total === 0
  const nonEmpty = data.filter(d => d.total > 0)

  // If no buckets remain after filtering, show placeholder
  if (nonEmpty.length === 0) {
    return (
      <div className="font-mono text-code-sm text-gray-500 italic">
        No questions loaded for this company yet.
      </div>
    )
  }

  return (
    <div className="bg-surface border border-gray-800 rounded-code shadow-elevation px-card py-3 mt-4">
      <h3 className="font-mono text-code-sm text-gray-300 mb-3">
        Your Progress by Bucket
      </h3>
      <ul className="list-none p-0 m-0">
        {nonEmpty.map(({ bucket, total, solved }) => {
          const pct = Math.round((solved / total) * 100)

          return (
            <li key={bucket} className="mb-3 last:mb-0">
              <div className="flex justify-between items-center font-mono text-code-sm text-gray-300 mb-1">
                <span>{bucket}</span>
                <span>
                  {solved} / {total} (<span className="text-primary">{pct}%</span>)
                </span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`
                    h-full rounded-full transition-all duration-1000 ease-out
                    relative overflow-hidden
                    ${pct === 100
                      ? 'bg-gradient-to-r from-success via-success/80 to-success'
                      : pct >= 75
                        ? 'bg-gradient-to-r from-info via-info/80 to-info'
                        : pct >= 50
                          ? 'bg-gradient-to-r from-warning via-warning/80 to-warning'
                          : 'bg-gradient-to-r from-primary via-primary/80 to-primary'}
                  `}
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

CompanyProgress.propTypes = {
  loading: PropTypes.bool,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      bucket: PropTypes.string.isRequired,
      total: PropTypes.number.isRequired,
      solved: PropTypes.number.isRequired,
    })
  ).isRequired,
}

CompanyProgress.defaultProps = {
  loading: false,
}