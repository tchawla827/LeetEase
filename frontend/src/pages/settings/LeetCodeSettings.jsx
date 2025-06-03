// src/pages/settings/LeetCodeSettings.jsx

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function LeetCodeSettings() {
  const { user, saveSettings } = useAuth()
  const initialSettings = user?.settings || {}

  const [leetUsername, setLeetUsername] = useState(initialSettings.leetUsername || '')
  const [syncOnStartup, setSyncOnStartup] = useState(
    typeof initialSettings.syncOnStartup === 'boolean'
      ? initialSettings.syncOnStartup
      : false
  )
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Rehydrate if user.settings changes
  useEffect(() => {
    const s = user?.settings || {}
    setLeetUsername(s.leetUsername || '')
    setSyncOnStartup(typeof s.syncOnStartup === 'boolean' ? s.syncOnStartup : false)
  }, [user?.settings])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const newSettings = {
        ...initialSettings,
        leetUsername,
        syncOnStartup,
      }
      await saveSettings(newSettings)
      setMessage('LeetCode settings saved successfully.')
    } catch (err) {
      setMessage('Failed to save LeetCode settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto text-gray-100">
      <h1 className="text-2xl font-semibold mb-6">LeetCode Settings</h1>

      {message && (
        <p className="mb-4 text-sm text-green-400">
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* LeetCode Username */}
        <div>
          <label className="block text-sm font-medium mb-1">
            LeetCode Username
          </label>
          <input
            type="text"
            value={leetUsername}
            onChange={(e) => setLeetUsername(e.target.value)}
            placeholder="e.g., your_leetcode_handle"
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sync on Startup Toggle */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={syncOnStartup}
              onChange={(e) => setSyncOnStartup(e.target.checked)}
              className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm">Sync LeetCode data on startup</span>
          </label>
          <p className="text-xs text-gray-400 mt-1">
            When enabled, the app will automatically fetch your LeetCode progress each time it starts.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
