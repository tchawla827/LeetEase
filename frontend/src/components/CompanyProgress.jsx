// frontend/src/components/CompanyProgress.jsx

import React from 'react'
import PropTypes from 'prop-types'

/**
 * Expects props.data to be an array of:
 *   { bucket: "30Days", total: 12, solved: 7 }
 * Renders a horizontal bar (or text) for each bucket showing "solved/total (XX%)".
 * **Skips any bucket where total === 0.**
 */
export default function CompanyProgress({ data, loading }) {
  if (loading) {
    return (
      <div className="font-mono text-code-sm text-gray-500 italic">
        Loading progress…
      </div>
    )
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
              <div className="w-full bg-gray-800 h-2 rounded overflow-hidden">
                <div
                  className="bg-green-500 h-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
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