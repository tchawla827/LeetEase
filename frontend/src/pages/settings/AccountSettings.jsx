// src/pages/settings/AccountSettings.jsx

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import UniversityAutocomplete from '../../components/UniversityAutocomplete.jsx'
import { extractErrorMessage } from '../../utils/error'

export default function AccountSettings() {
  const {
    user,
    fetchAccountProfile,
    editAccountProfile,
    changeProfilePhoto,
    removeProfilePhoto
  } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    college: '',
    email: ''
  })
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null)
  const [newPhotoFile, setNewPhotoFile] = useState(null)

  // Fetch current account data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetchAccountProfile()
        const data = res.data
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          college: data.college || '',
          email: data.email || ''
        })
        setProfilePhotoUrl(data.profilePhoto || null)
      } catch (err) {
        setError(extractErrorMessage(err) || 'Failed to load account data.')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [fetchAccountProfile])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.firstName.trim()) {
      setError('First Name is required.')
      return
    }
    if (!formData.email.trim()) {
      setError('Email is required.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      setError('Invalid email format.')
      return
    }

    const payload = {
      firstName: formData.firstName.trim(),
      lastName:  formData.lastName.trim() || null,
      college:   formData.college.trim() || null,
      email:     formData.email.trim().toLowerCase()
    }

    try {
      setLoading(true)
      await editAccountProfile(payload)
      setError('')
    } catch (err) {
      setError(extractErrorMessage(err) || 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setNewPhotoFile(file)
  }

  const handleUploadPhoto = async () => {
    if (!newPhotoFile) return
    setError('')
    setLoading(true)
    const form = new FormData()
    form.append('photo', newPhotoFile)

    try {
      const url = await changeProfilePhoto(form)
      setProfilePhotoUrl(url)
      setNewPhotoFile(null)
  } catch (err) {
      setError('Failed to upload photo.')
  } finally {
      setLoading(false)
  }
  }

  const handleRemovePhoto = async () => {
    setError('')
    setLoading(true)
    try {
      await removeProfilePhoto()
      setProfilePhotoUrl(null)
  } catch (err) {
      setError('Failed to remove photo.')
  } finally {
      setLoading(false)
  }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto p-card bg-surface border border-gray-800 rounded-card shadow-elevation mt-8">
      <h2 className="text-code-lg text-primary font-mono text-center mb-6">
        Account Settings
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-code">
          <p className="text-red-400 text-code-sm font-mono">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-code-sm text-gray-300 font-mono mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-code px-3 py-2 text-code-base text-gray-100 font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-code-sm text-gray-300 font-mono mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-code px-3 py-2 text-code-base text-gray-100 font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-code-sm text-gray-300 font-mono mb-1">
            College/University
          </label>
          <UniversityAutocomplete
            value={formData.college}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, college: val }))
            }
          />
        </div>

        <div>
          <label className="block text-code-sm text-gray-300 font-mono mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full bg-gray-900 border border-gray-700 rounded-code px-3 py-2 text-code-base text-gray-100 font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>


        <p className="text-center text-code-sm text-gray-400 font-mono">
          <Link to="/forgot-password" className="text-primary hover:underline">
            Reset password via email
          </Link>
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-white font-mono text-code-base py-2 px-4 rounded-code transition-colors disabled:opacity-50"
        >
          Save Changes
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-code-base text-gray-300 font-mono mb-2">
          Profile Photo
        </h3>
        {profilePhotoUrl ? (
          <div className="flex items-center space-x-4">
            <img
              src={profilePhotoUrl}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border border-gray-700"
            />
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => document.getElementById('photoUploadInput').click()}
                className="bg-secondary hover:bg-secondary/90 text-white font-mono text-code-sm py-1 px-3 rounded-code transition-colors"
              >
                Change Photo
              </button>
              <button
                onClick={handleRemovePhoto}
                className="bg-danger hover:bg-[#da3633] text-white font-mono text-code-sm py-1 px-3 rounded-code transition-colors"
              >
                Remove Photo
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-code-sm text-gray-400 font-mono mb-2">
              No profile photo yet.
            </p>
            <button
              onClick={() => document.getElementById('photoUploadInput').click()}
              className="bg-secondary hover:bg-secondary/90 text-white font-mono text-code-sm py-1 px-3 rounded-code transition-colors"
            >
              Upload Photo
            </button>
          </div>
        )}

        <input
          id="photoUploadInput"
          type="file"
          accept="image/png, image/jpeg, image/jpg"
          onChange={handlePhotoChange}
          className="hidden"
        />

        {newPhotoFile && (
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-code-sm text-gray-200 font-mono">
              {newPhotoFile.name}
            </span>
            <button
              onClick={handleUploadPhoto}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white font-mono text-code-sm py-1 px-3 rounded-code transition-colors disabled:opacity-50"
            >
              Upload
            </button>
            <button
              onClick={() => setNewPhotoFile(null)}
              disabled={loading}
              className="bg-gray-700 hover:bg-gray-600 text-white font-mono text-code-sm py-1 px-3 rounded-code transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link to="/" className="text-primary hover:underline text-code-sm font-mono">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
