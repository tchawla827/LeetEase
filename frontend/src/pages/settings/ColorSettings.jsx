// src/pages/settings/ColorSettings.jsx

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function ColorSettings() {
  const { user, saveSettings } = useAuth()
  const initialSettings = user?.settings || {}
  const [colorMode, setColorMode] = useState(initialSettings.colorMode || 'leet')
  const [palette, setPalette] = useState({
    easy:   initialSettings.palette?.easy   || '#8BC34A',
    medium: initialSettings.palette?.medium || '#FFB74D',
    hard:   initialSettings.palette?.hard   || '#E57373',
    solved: initialSettings.palette?.solved || '#9E9E9E',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // If user.settings change (e.g., on login), rehydrate form
  useEffect(() => {
    const s = user?.settings || {}
    setColorMode(s.colorMode || 'leet')
    setPalette({
      easy:   s.palette?.easy   || '#8BC34A',
      medium: s.palette?.medium || '#FFB74D',
      hard:   s.palette?.hard   || '#E57373',
      solved: s.palette?.solved || '#9E9E9E',
    })
  }, [user?.settings])

  const handlePaletteChange = (key, value) => {
    setPalette(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const newSettings = { colorMode, palette }
      await saveSettings(newSettings)
      setMessage('Color settings updated successfully.')
    } catch (err) {
      setMessage('Failed to update color settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto text-gray-100">
      <h1 className="text-2xl font-semibold mb-6">Color Settings</h1>

      {message && (
        <p className="mb-4 text-sm text-green-400">
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Color Mode Selector */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Color Mode
          </label>
          <select
            value={colorMode}
            onChange={(e) => setColorMode(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="leet">Leet Mode</option>
            <option value="user">User Mode</option>
          </select>
        </div>

        {/* Palette Inputs */}
        <div>
          <p className="block text-sm font-medium mb-2">Palette Colors</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1">Easy</label>
              <input
                type="text"
                value={palette.easy}
                onChange={(e) => handlePaletteChange('easy', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#8BC34A"
              />
            </div>

            <div>
              <label className="block text-xs mb-1">Medium</label>
              <input
                type="text"
                value={palette.medium}
                onChange={(e) => handlePaletteChange('medium', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#FFB74D"
              />
            </div>

            <div>
              <label className="block text-xs mb-1">Hard</label>
              <input
                type="text"
                value={palette.hard}
                onChange={(e) => handlePaletteChange('hard', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#E57373"
              />
            </div>

            <div>
              <label className="block text-xs mb-1">Solved</label>
              <input
                type="text"
                value={palette.solved}
                onChange={(e) => handlePaletteChange('solved', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#9E9E9E"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
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
