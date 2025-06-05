import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ResetPassword() {
  const { finalizeReset } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const initialToken = searchParams.get('token') || ''
  const [token, setToken] = useState(initialToken)
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!token.trim()) {
      setError('Reset token is required.')
      return
    }
    if (form.newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await finalizeReset(token.trim(), form.newPassword)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.description || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="max-w-sm w-full bg-surface border border-gray-700 rounded-card shadow-elevation px-card py-6 space-y-4">
          <h1 className="text-code-lg text-primary font-mono text-center">Password Reset</h1>
          <p className="text-gray-300 text-code-base text-center">Your password has been updated.</p>
          <Link to="/login" className="text-primary hover:underline text-center block">Continue to login</Link>
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
            <p className="text-gray-300 text-code-base">Saving…</p>
          </div>
        )}
        <h1 className="text-code-lg text-primary font-mono text-center">Reset Password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!initialToken && (
            <div className="space-y-2">
              <label className="block text-code-sm text-gray-300 font-mono">Reset Token</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-code px-3 py-2 text-code-base text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-code-sm text-gray-300 font-mono">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              minLength="8"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-code px-3 py-2 text-code-base text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-code-sm text-gray-300 font-mono">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              minLength="8"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-code px-3 py-2 text-code-base text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {error && <p className="text-red-400 text-code-sm font-mono">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-mono text-code-base py-2 px-4 rounded-code transition-colors disabled:opacity-50"
          >
            Reset Password
          </button>
        </form>
        <p className="text-center text-code-sm text-gray-400 font-mono">
          <Link to="/login" className="text-primary hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  )
}
