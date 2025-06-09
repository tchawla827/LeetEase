import React from 'react'
import Spinner from './Spinner'

export default function Loading({ message = 'Loading…', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Spinner size={32} className="mb-2" />
      {message && (
        <p className="text-gray-500 dark:text-gray-400 font-mono text-code-sm">
          {message}
        </p>
      )}
    </div>
  )
}
