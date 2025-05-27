// frontend/src/pages/Login.jsx

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login }       = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const navigate                = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    try {
      // attempt login — assume response includes the user object
      const res = await api.post('/auth/login', { email, password })
      const user = res.data
      login(user)
      navigate('/') // redirect to home/dashboard
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.description || 'Login failed')
    }
  }

  return (
    <div style={{ padding: '1rem', maxWidth: 400, margin: '0 auto' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label>
            Email:&nbsp;
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
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
            />
          </label>
        </div>
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Login
        </button>
        {error && (
          <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>
        )}
      </form>
      <p style={{ marginTop: '1rem' }}>
        Don’t have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  )
}
