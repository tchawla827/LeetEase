import React from 'react'

export default function ErrorToast({ message, visible, onClose }) {
  return (
    <div
      className={`fixed bottom-4 right-4 rounded-code p-2 pl-3 shadow-elevation-md flex items-center z-50 transform transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      style={{
        background: 'rgb(var(--color-surface))',
        border: '1px solid rgb(var(--color-error))',
        color: 'rgb(var(--color-error))',
      }}
    >
      <span className="pr-3">{message}</span>
      <button
        onClick={onClose}
        className="ml-auto"
        aria-label="Close"
        style={{ color: 'rgb(var(--color-gray-300))' }}
      >
        ×
      </button>
    </div>
  )
}
