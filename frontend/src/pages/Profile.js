import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Profile() {
  const { syncBackground } = useAuth()

  const [loading, setLoading]             = useState(true)
  const [firstName, setFirstName]         = useState('')
  const [lastName, setLastName]           = useState('')
  const [email, setEmail]                 = useState('')
  const [college, setCollege]             = useState('')
  const [role, setRole]                   = useState('')             // new
  const [leetcodeUsername, setLeetcodeUsername] = useState('')
  const [leetcodeSession, setLeetcodeSession]   = useState('')
  const [message, setMessage]             = useState('')
  const [error, setError]                 = useState('')
  const [backfillLoading, setBackfillLoading] = useState(false)    // new

  // load profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me')
        const data = res.data
        setFirstName(data.firstName || '')
        setLastName(data.lastName || '')
        setEmail(data.email || '')
        setCollege(data.college || '')
        setRole(data.role || '')                             // new
        setLeetcodeUsername(data.leetcode_username || '')
        setLeetcodeSession(data.leetcode_session || '')
      } catch (err) {
        console.error(err)
        setError(err.response?.data?.description || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  // save handle + sessionCookie
  const saveHandle = async () => {
    setMessage('')
    setError('')
    if (!leetcodeUsername.trim() || !leetcodeSession.trim()) {
      setError('Both username and session cookie are required')
      return
    }
    try {
      await api.post('/profile/leetcode', {
        username:      leetcodeUsername.trim(),
        sessionCookie: leetcodeSession.trim(),
      })
      setMessage('LeetCode profile saved')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.description || 'Save failed')
    }
  }

  // manual sync now uses syncBackground()
  const syncHandle = async () => {
    setMessage('')
    setError('')
    try {
      const count = await syncBackground()
      setMessage(`Synced ${count} questions`)
      window.dispatchEvent(new Event('leetSync'))
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.description || 'Sync failed')
    }
  }

  // new: trigger backfill-tags
  const backfillTags = async () => {
    setMessage('')
    setError('')
    setBackfillLoading(true)
    try {
      await api.post('/api/admin/backfill-tags')
      setMessage('Tags backfilled successfully')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.description || 'Backfill failed')
    } finally {
      setBackfillLoading(false)
    }
  }

  if (loading) return <div>Loading profile…</div>

  return (
    <div style={{ padding: '1rem', maxWidth: 600, margin: '0 auto' }}>
      <h2>Profile</h2>

      <div style={{ marginBottom: '0.75rem' }}>
        <strong>First Name:</strong> {firstName}
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <strong>Last Name:</strong> {lastName}
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <strong>Email:</strong> {email}
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <strong>College:</strong> {college || '—'}
      </div>
      <div style={{ marginBottom: '1.5rem' }}>
        <strong>Role:</strong> {role}
      </div>

      <hr style={{ margin: '1rem 0' }} />

      <div style={{ marginBottom: '0.75rem' }}>
        <label>
          <strong>LeetCode Username:</strong>&nbsp;
          <input
            type="text"
            value={leetcodeUsername}
            onChange={e => setLeetcodeUsername(e.target.value)}
            placeholder="e.g. your_handle"
            style={{ width: '60%' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label>
          <strong>LEETCODE_SESSION Cookie:</strong>&nbsp;
          <input
            type="text"
            value={leetcodeSession}
            onChange={e => setLeetcodeSession(e.target.value)}
            placeholder="Paste your LEETCODE_SESSION"
            style={{ width: '60%' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={saveHandle}
          style={{ padding: '0.5rem 1rem', marginRight: '1rem' }}
        >
          Save LeetCode Profile
        </button>
        <button
          onClick={syncHandle}
          style={{ padding: '0.5rem 1rem', marginRight: '1rem' }}
        >
          Sync Solved Questions
        </button>
        {role === 'admin' && (
          <button
            onClick={backfillTags}
            disabled={backfillLoading}
            style={{ padding: '0.5rem 1rem' }}
          >
            {backfillLoading ? 'Backfilling…' : 'Backfill Tags'}
          </button>
        )}
      </div>

      {message && (
        <p style={{ color: 'green', marginTop: '0.5rem' }}>{message}</p>
      )}
      {error && (
        <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>
      )}
    </div>
  )
}
