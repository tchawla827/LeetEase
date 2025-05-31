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
    return <div>Loading progress…</div>
  }

  // Filter out any bucket with total === 0
  const nonEmpty = data.filter(d => d.total > 0)

  // If no buckets remain after filtering, show placeholder
  if (nonEmpty.length === 0) {
    return <div>No questions loaded for this company yet.</div>
  }

  return (
    <div style={{ margin: '1rem 0', padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4 }}>
      <h3 style={{ margin: '0 0 0.5rem 0' }}>Your Progress by Bucket</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {nonEmpty.map(({ bucket, total, solved }) => {
          const pct = Math.round((solved / total) * 100)
          // Inline styling for the bar container and filled portion
          const barContainer = {
            width: '100%',
            height: '0.8rem',
            background: '#f0f0f0',
            borderRadius: 2,
            overflow: 'hidden',
            marginTop: '0.2rem',
          }
          const barFilled = {
            width: `${pct}%`,
            height: '100%',
            background: '#4caf50',
          }

          return (
            <li key={bucket} style={{ marginBottom: '0.8rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.9rem',
                }}
              >
                <span>{bucket}</span>
                <span>
                  {solved} / {total} ({pct}%)
                </span>
              </div>
              <div style={barContainer}>
                <div style={barFilled} />
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
