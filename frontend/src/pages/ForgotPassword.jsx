import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { extractErrorMessage } from '../utils/error'

export default function ForgotPassword() {
  const { requestReset } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await requestReset(email)
      setSent(true)
    } catch (err) {
      setError(extractErrorMessage(err) || 'Failed to send reset email.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="max-w-sm w-full bg-surface border border-gray-700 rounded-card shadow-elevation px-card py-6 space-y-4">
          <h1 className="text-code-lg text-primary font-mono text-center">Check Your Email</h1>
          <p className="text-gray-300 text-code-base text-center">
            If that email exists, a reset link has been sent.
          </p>
          <Link to="/login" className="text-primary hover:underline text-center block">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="relative max-w-sm w-full bg-surface border border-gray-700 rounded-card shadow-elevation px-card py-6 space-y-4">
        {loading && (
          <div className="absolute inset-0 bg-gray-800/70 flex flex-col items-center justify-center z-50 rounded-card">
            <div className="w-12 h-12 border-4 border-gray-600 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-gray-300 text-code-base">Sending…</p>
          </div>
        )}
        <h1 className="text-code-lg text-primary font-mono text-center">Forgot Password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-code-sm text-gray-300 font-mono">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-gray-800 border border-gray-700 rounded-code px-3 py-2 text-code-base text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
          </div>
          {error && <p className="text-red-400 text-code-sm font-mono">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-mono text-code-base py-2 px-4 rounded-code transition-colors disabled:opacity-50"
          >
            Send Reset Email
          </button>
        </form>
        <p className="text-center text-code-sm text-gray-400 font-mono">
          Remembered?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
