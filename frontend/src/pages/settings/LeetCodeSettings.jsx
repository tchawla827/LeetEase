// src/pages/settings/LeetCodeSettings.jsx

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import { extractErrorMessage } from '../../utils/error'
import Loading from '../../components/Loading'

export default function LeetCodeSettings() {
  const { user, syncBackground } = useAuth()

  const [loading, setLoading] = useState(true)
  const [leetcodeUsername, setLeetcodeUsername] = useState('')
  const [leetcodeSession, setLeetcodeSession] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setLeetcodeUsername(user.leetcode_username || '')
      setLeetcodeSession(user.leetcode_session || '')
    }
    setLoading(false)
  }, [user])

  const saveHandle = async () => {
    setMessage('')
    setError('')
    if (!leetcodeUsername.trim() || !leetcodeSession.trim()) {
      setError('Both username and session cookie are required')
      return
    }
    try {
      await api.post('/profile/leetcode', {
        username: leetcodeUsername.trim(),
        sessionCookie: leetcodeSession.trim(),
      })
      setMessage('LeetCode profile saved')
    } catch (err) {
      setError(extractErrorMessage(err) || 'Save failed')
    }
  }

  const syncHandle = async () => {
    setMessage('')
    setError('')
    try {
      const count = await syncBackground()
      setMessage(`Synced ${count} questions`)
      window.dispatchEvent(new Event('leetSync'))
    } catch (err) {
      setError(extractErrorMessage(err) || 'Sync failed')
    }
  }

  if (loading) {
    return <Loading message="Loading LeetCode settings…" />
  }

  return (
    <div className="font-mono text-code-base text-gray-700 dark:text-gray-300 max-w-3xl mx-auto p-card space-y-6">
      <h1 className="text-code-lg text-primary">LeetCode Integration</h1>

      <p className="text-code-sm text-gray-600 dark:text-gray-400">
        Follow these steps to find your <code>LEETCODE_SESSION</code> cookie:
      </p>
      <ol className="list-decimal pl-5 space-y-1 text-code-sm text-gray-600 dark:text-gray-400">
        <li>
          Log in at
          {' '}
          <a
            href="https://leetcode.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            leetcode.com
          </a>
        </li>
        <li>Open your browser dev tools (Ctrl+Shift+I or Cmd+Opt+I)</li>
        <li>In the <strong>Application</strong> tab, expand <strong>Cookies</strong></li>
        <li>
          Choose <code>https://leetcode.com</code> and copy the value of
          {' '}
          <code>LEETCODE_SESSION</code>
        </li>
      </ol>

      <div className="bg-surface border border-gray-300 dark:border-gray-800 rounded-card shadow-elevation p-card space-y-4">
        <div className="space-y-4">
          <div>
            <label className="block text-code-sm text-gray-600 dark:text-gray-400 mb-1">
              LeetCode Username
            </label>
            <input
              type="text"
              value={leetcodeUsername}
              onChange={(e) => setLeetcodeUsername(e.target.value)}
              placeholder="e.g. your_handle"
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-code px-3 py-2 text-code-base focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-code-sm text-gray-600 dark:text-gray-400 mb-1">
              LEETCODE_SESSION Cookie
            </label>
            <input
              type="text"
              value={leetcodeSession}
              onChange={(e) => setLeetcodeSession(e.target.value)}
              placeholder="Paste your LEETCODE_SESSION"
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-code px-3 py-2 text-code-base focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-code">
            <button
              onClick={saveHandle}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-code text-code-base transition-colors"
            >
              Save LeetCode Profile
            </button>
            <button
              onClick={syncHandle}
              className="border border-primary text-primary hover:bg-primary/10 px-4 py-2 rounded-code text-code-base transition-colors"
            >
              Sync Solved Questions
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="bg-green-100 border border-green-300 text-green-700 rounded-code p-card text-code-base dark:bg-green-900/50 dark:border-green-800 dark:text-green-400">
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
