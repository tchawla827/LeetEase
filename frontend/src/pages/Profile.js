// src/pages/Profile.js

import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Profile() {
  const { user, saveSettings } = useAuth()

  const [loading, setLoading] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [college, setCollege] = useState('')
  const [role, setRole] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [colorMode, setColorMode] = useState('leet')
  const [easyColor, setEasyColor] = useState('#8BC34A')
  const [mediumColor, setMediumColor] = useState('#FFB74D')
  const [hardColor, setHardColor] = useState('#E57373')
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

        const s = data.settings || {}
        setColorMode(s.colorMode || 'leet')
        setEasyColor(s.palette?.easy || '#8BC34A')
        setMediumColor(s.palette?.medium || '#FFB74D')
        setHardColor(s.palette?.hard || '#E57373')
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

  // Handler for saving color settings
  const handleSaveColors = async () => {
    setMessage('')
    setError('')

    try {
      await saveSettings({
        colorMode,
        palette: {
          easy: easyColor,
          medium: mediumColor,
          hard: hardColor,
          solved: solvedColor
        }
      })
      setMessage('Color settings saved!')
    } catch (err) {
      console.error(err)
      setError('Failed to save color settings')
    }
  }

  if (loading) {
    return (
      <div className="font-mono text-code-base text-gray-300 p-card">
        Loading profile…
      </div>
    )
  }

  return (
    <div className="font-mono text-code-base text-gray-300 max-w-3xl mx-auto p-card space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-code-lg text-primary">Your Profile</h1>
        <div className="flex items-center gap-code">
          <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-300">
            {firstName.charAt(0)}
            {lastName.charAt(0)}
          </div>
          <div>
            <p className="text-code-base">{firstName} {lastName}</p>
            <p className="text-code-sm text-gray-400">{email}</p>
          </div>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-surface border border-gray-800 rounded-card shadow-elevation p-card">
        <h2 className="text-code-lg text-primary pb-2 border-b border-gray-800 mb-4">
          User Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-code">
          <div className="space-y-2">
            <div>
              <p className="text-code-sm text-gray-400">First Name</p>
              <p className="text-code-base">{firstName}</p>
            </div>
            <div>
              <p className="text-code-sm text-gray-400">Last Name</p>
              <p className="text-code-base">{lastName}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-code-sm text-gray-400">Email</p>
              <p className="text-code-base">{email}</p>
            </div>
            <div>
              <p className="text-code-sm text-gray-400">Account Created</p>
              <p className="text-code-base">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Color Settings */}
      <div className="bg-surface border border-gray-800 rounded-card shadow-elevation p-card space-y-4">
        <h2 className="text-code-lg text-primary pb-2 border-b border-gray-800">
          Color Settings
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-code-base">Color Mode</label>
            <select
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-code px-3 py-1 text-code-base focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="leet">Based on Leet difficulty</option>
              <option value="user">Based on your difficulty</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-code">
            <div className="flex items-center gap-code">
              <label className="text-code-base">Easy:</label>
              <input
                type="color"
                value={easyColor}
                onChange={(e) => setEasyColor(e.target.value)}
                className="h-8 w-8 rounded-code cursor-pointer"
              />
              <span className="text-code-sm">{easyColor}</span>
            </div>
            <div className="flex items-center gap-code">
              <label className="text-code-base">Medium:</label>
              <input
                type="color"
                value={mediumColor}
                onChange={(e) => setMediumColor(e.target.value)}
                className="h-8 w-8 rounded-code cursor-pointer"
              />
              <span className="text-code-sm">{mediumColor}</span>
            </div>
            <div className="flex items-center gap-code">
              <label className="text-code-base">Hard:</label>
              <input
                type="color"
                value={hardColor}
                onChange={(e) => setHardColor(e.target.value)}
                className="h-8 w-8 rounded-code cursor-pointer"
              />
              <span className="text-code-sm">{hardColor}</span>
            </div>
            <div className="flex items-center gap-code">
              <label className="text-code-base">Solved:</label>
              <input
                type="color"
                value={solvedColor}
                onChange={(e) => setSolvedColor(e.target.value)}
                className="h-8 w-8 rounded-code cursor-pointer"
              />
              <span className="text-code-sm">{solvedColor}</span>
            </div>
          </div>

          <button
            onClick={handleSaveColors}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-code text-code-base transition-colors w-full"
          >
            Save Color Settings
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-900/50 border border-green-800 rounded-code p-card text-code-base text-green-400">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-900/50 border border-red-800 rounded-code p-card text-code-base text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}
