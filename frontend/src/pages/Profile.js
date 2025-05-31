import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Profile() {
  const { user, saveSettings, syncBackground } = useAuth()

  const [loading, setLoading]             = useState(true)
  const [firstName, setFirstName]         = useState('')
  const [lastName, setLastName]           = useState('')
  const [email, setEmail]                 = useState('')
  const [college, setCollege]             = useState('')
  const [role, setRole]                   = useState('')
  const [leetcodeUsername, setLeetcodeUsername] = useState('')
  const [leetcodeSession, setLeetcodeSession]   = useState('')
  const [message, setMessage]             = useState('')
  const [error, setError]                 = useState('')

  // ─── NEW: Color & mode state ───────────────────────────────────────────
  const [colorMode,   setColorMode]   = useState('leet')
  const [easyColor,   setEasyColor]   = useState('#8BC34A')
  const [mediumColor, setMediumColor] = useState('#FFB74D')
  const [hardColor,   setHardColor]   = useState('#E57373')
  const [solvedColor, setSolvedColor] = useState('#9E9E9E')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me')
        const data = res.data
        setFirstName(data.firstName || '')
        setLastName(data.lastName || '')
        setEmail(data.email || '')
        setCollege(data.college || '')
        setRole(data.role || '')
        setLeetcodeUsername(data.leetcode_username || '')
        setLeetcodeSession(data.leetcode_session || '')

        // ─── NEW: seed color settings from data.settings ─────────────
        const s = data.settings || {}
        setColorMode(s.colorMode || 'leet')
        setEasyColor(  s.palette?.easy   || '#8BC34A')
        setMediumColor(s.palette?.medium || '#FFB74D')
        setHardColor(  s.palette?.hard   || '#E57373')
        setSolvedColor(s.palette?.solved || '#9E9E9E')
      } catch (err) {
        console.error(err)
        setError(err.response?.data?.description || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  // save LeetCode handle + sessionCookie
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
      </div>

      <hr style={{ margin: '1rem 0' }} />

      {/* ─── NEW: Color Settings Section ───────────────────────────────── */}
      <h3>Color Settings</h3>

      <label>
        <strong>Color Mode:</strong>&nbsp;
        <select
          value={colorMode}
          onChange={e => setColorMode(e.target.value)}
          style={{ marginLeft: '0.5rem' }}
        >
          <option value="leet">Based on Leet difficulty</option>
          <option value="user">Based on your difficulty</option>
        </select>
      </label>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
        <label>
          Easy:&nbsp;
          <input
            type="color"
            value={easyColor}
            onChange={e => setEasyColor(e.target.value)}
          />
        </label>
        <label>
          Medium:&nbsp;
          <input
            type="color"
            value={mediumColor}
            onChange={e => setMediumColor(e.target.value)}
          />
        </label>
        <label>
          Hard:&nbsp;
          <input
            type="color"
            value={hardColor}
            onChange={e => setHardColor(e.target.value)}
          />
        </label>
        <label>
          Solved:&nbsp;
          <input
            type="color"
            value={solvedColor}
            onChange={e => setSolvedColor(e.target.value)}
          />
        </label>
      </div>

      <button
        onClick={async () => {
          setMessage('')
          setError('')
          try {
            await saveSettings({
              colorMode,
              palette: {
                easy:   easyColor,
                medium: mediumColor,
                hard:   hardColor,
                solved: solvedColor
              }
            })
            setMessage('Color settings saved!')
          } catch (err) {
            console.error(err)
            setError('Failed to save color settings')
          }
        }}
        style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
      >
        Save Color Settings
      </button>

      {message && <p style={{ color: 'green', marginTop: '0.5rem' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
    </div>
  )
}
