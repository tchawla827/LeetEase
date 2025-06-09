// src/pages/settings/ColorSettings.jsx

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function ColorSettings() {
  const { user, saveSettings } = useAuth()
  const [colorMode, setColorMode] = useState('leet')
  const [easyColor, setEasyColor] = useState('#8BC34A')
  const [mediumColor, setMediumColor] = useState('#FFB74D')
  const [hardColor, setHardColor] = useState('#E57373')
  const [solvedColor, setSolvedColor] = useState('#9E9E9E')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const s = user?.settings || {}
    setColorMode(s.colorMode || 'leet')
    setEasyColor(s.palette?.easy || '#8BC34A')
    setMediumColor(s.palette?.medium || '#FFB74D')
    setHardColor(s.palette?.hard || '#E57373')
    setSolvedColor(s.palette?.solved || '#9E9E9E')
  }, [user?.settings])

  const handleSaveColors = async () => {
    setMessage('')
    setError('')
    setLoading(true)
    try {
      await saveSettings({
        colorMode,
        palette: {
          easy: easyColor,
          medium: mediumColor,
          hard: hardColor,
          solved: solvedColor,
        },
      })
      setMessage('Color settings saved!')
    } catch (err) {
      setError('Failed to save color settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="font-mono text-code-base text-gray-700 dark:text-gray-300 max-w-3xl mx-auto p-card space-y-6">
      <h1 className="text-code-lg text-primary">Color Settings</h1>

      <div className="bg-surface border border-gray-800 rounded-card shadow-elevation p-card space-y-4">
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
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-code text-code-base transition-colors w-full disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save Color Settings'}
          </button>
        </div>
      </div>

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
