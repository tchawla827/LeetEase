// src/pages/Profile.js

import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { extractErrorMessage } from '../utils/error'

export default function Profile() {
  const { user, syncBackground } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div className="font-mono text-code-base text-gray-700 dark:text-gray-300 p-card">
        Loading profile…
      </div>
    )
  }

  const {
    firstName = '',
    lastName = '',
    email = '',
    college = '',
    role = '',
    profilePhoto
  } = user

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`

  const handleSync = async () => {
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

  return (
    <div className="font-mono text-code-base text-gray-700 dark:text-gray-300 max-w-3xl mx-auto p-card space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-code">
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt="Profile"
              className="h-32 w-32 rounded-full object-cover border border-gray-300 dark:border-gray-700"
            />
          ) : (
            <div className="h-32 w-32 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 text-5xl">
              {initials}
            </div>
          )}
          <div>
            <p className="text-4xl text-primary">
              {firstName} {lastName}
            </p>
              <p className="text-code-sm text-gray-600 dark:text-gray-400">{email}</p>
          </div>
        </div>
        <div className="flex gap-code">
          <Link
            to="/settings/account"
            className="bg-primary hover:bg-[#2a7aeb] dark:hover:bg-primary/90 text-white font-mono text-code-sm py-2 px-4 rounded-code transition-colors"
          >
            Edit Profile
          </Link>
          <button
            onClick={handleSync}
            className="border border-primary text-primary hover:bg-primary/20 dark:hover:bg-primary/10 font-mono text-code-sm py-2 px-4 rounded-code transition-colors"
          >
            Sync Questions
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

      {/* User Info Card */}
      <div className="bg-surface border border-gray-300 dark:border-gray-800 rounded-card shadow-elevation p-card">
        <h2 className="text-code-lg text-primary pb-2 border-b border-gray-300 dark:border-gray-800 mb-4">
          User Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-code">
          <div className="space-y-2">
            <div>
              <p className="text-code-sm text-gray-600 dark:text-gray-400">First Name</p>
              <p className="text-code-base">{firstName}</p>
            </div>
            <div>
              <p className="text-code-sm text-gray-600 dark:text-gray-400">Last Name</p>
              <p className="text-code-base">{lastName}</p>
            </div>
            <div>
              <p className="text-code-sm text-gray-600 dark:text-gray-400">College/University</p>
              <p className="text-code-base">{college || '—'}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-code-sm text-gray-600 dark:text-gray-400">Email</p>
              <p className="text-code-base">{email}</p>
            </div>
            <div>
              <p className="text-code-sm text-gray-600 dark:text-gray-400">Role</p>
              <p className="text-code-base">{role || 'user'}</p>
            </div>
            <div>
              <p className="text-code-sm text-gray-600 dark:text-gray-400">Account Created</p>
              <p className="text-code-base">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
