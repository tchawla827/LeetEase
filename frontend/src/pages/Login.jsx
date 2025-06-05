import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/home')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.description || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="relative max-w-sm w-full bg-surface border border-gray-700 rounded-card shadow-elevation px-card py-6 space-y-4">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-gray-800/70 flex flex-col items-center justify-center z-50 rounded-card">
            <div className="w-12 h-12 border-4 border-gray-600 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-gray-300 text-code-base">Signing in…</p>
          </div>
        )}

        {/* Form Header */}
        <h1 className="text-code-lg text-primary font-mono text-center">Login</h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-code-sm text-gray-300 font-mono">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-gray-800 border border-gray-700 rounded-code px-3 py-2 text-code-base text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-code-sm text-gray-300 font-mono">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-gray-800 border border-gray-700 rounded-code px-3 py-2 text-code-base text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="text-red-400 text-code-sm font-mono">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-mono text-code-base py-2 px-4 rounded-code transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>
        <p className="text-center text-code-sm text-gray-400 font-mono mt-2">
          <Link to="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </p>

        {/* Registration Link */}
        <p className="text-center text-code-sm text-gray-400 font-mono">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}