import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login }               = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate                = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // perform login
      await login(email, password)
      // redirect home—this will remount Sidebar and fetch companies
      navigate('/')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.description || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        padding:    '1rem',
        maxWidth:   400,
        margin:     '0 auto',
        position:   'relative'
      }}
    >
      <h2>Login</h2>

      {loading && (
        <div
          style={{
            position:        'absolute',
            top: 0, left: 0,
            width:           '100%',
            height:          '100%',
            background:      'rgba(255,255,255,0.7)',
            display:         'flex',
            flexDirection:   'column',
            alignItems:      'center',
            justifyContent:  'center',
            zIndex:          1000
          }}
        >
          <div
            style={{
              border:       '4px solid #ddd',
              borderTop:    '4px solid #333',
              borderRadius: '50%',
              width:        '3rem',
              height:       '3rem',
              animation:    'spin 1s linear infinite',
              marginBottom: '1rem'
            }}
          />
          <p>Signing in…</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label>
            Email:&nbsp;
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Password:&nbsp;
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </label>
        </div>
        <button
          type="submit"
          style={{ padding: '0.5rem 1rem' }}
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Login'}
        </button>
        {error && (
          <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>
        )}
      </form>

      <p style={{ marginTop: '1rem' }}>
        Don’t have an account? <Link to="/register">Register</Link>
      </p>

      {/* spinner keyframes */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}
