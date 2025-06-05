import React from 'react'
import colors from '../styles/colors'

export default function ErrorToast({ message, visible, onClose }) {
  return (
    <div
      className={`fixed bottom-4 right-4 rounded-code p-2 pl-3 shadow-elevation-md flex items-center z-50 transform transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      style={{
        background: colors.dark.surface,
        border: `1px solid ${colors.dark.error}`,
        color: colors.dark.error,
      }}
    >
      <span className="pr-3">{message}</span>
      <button
        onClick={onClose}
        className="ml-auto"
        aria-label="Close"
        style={{ color: colors.dark.gray[300] }}
      >
        ×
      </button>
    </div>
  )
}
