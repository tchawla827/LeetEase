// src/pages/Profile.js

import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Profile() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [college, setCollege] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')

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
      } catch (err) {
        console.error(err)
        setError(err.response?.data?.description || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

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

      {/* Display error if profile loading fails */}
      {error && (
        <div className="bg-red-900/50 border border-red-800 rounded-code p-card text-code-base text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}
