// frontend/src/pages/Register.jsx

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    college: '',
    leetcodeUsername: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // OTP
  const [otp, setOtp] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // STEP 1: Request OTP via POST /auth/register
  const handleSubmitForm = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { firstName, email, password, confirmPassword } = formData
    if (!firstName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('First name, email, password, and confirm password are all required.')
      setLoading(false)
      return
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    try {
      // Send all form fields; backend /auth/register will pick out the ones it needs
      await api.post('/auth/register', {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim() || undefined,
        college: formData.college.trim() || undefined,
        leetcodeUsername: formData.leetcodeUsername.trim() || undefined,
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      })
      // On success, backend has stored reg_data in session and emailed OTP
      setStep(2)
    } catch (err) {
      console.error('Request OTP error:', err)
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to request OTP'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // STEP 2: Verify OTP via POST /auth/verify
  const handleSubmitOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!otp.trim()) {
      setError('Please enter the 6-digit OTP.')
      setLoading(false)
      return
    }

    try {
      await api.post('/auth/verify', { otp: otp.trim() })
      // On success, registration is complete; redirect to login
      navigate('/login')
    } catch (err) {
      console.error('Verify OTP error:', err)
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid or expired OTP'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-surface border border-gray-800 rounded-card shadow-elevation px-card py-6">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-gray-800/70 flex items-center justify-center z-50 rounded-card">
            <div className="w-12 h-12 border-4 border-gray-600 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === 1 ? 'bg-primary' : 'bg-gray-700'
              }`}
            >
              <span className="text-code-sm font-mono">1</span>
            </div>
            <div
              className={`w-12 h-1 mx-2 ${
                step === 2 ? 'bg-primary' : 'bg-gray-700'
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === 2 ? 'bg-primary' : 'bg-gray-700'
              }`}
            >
              <span className="text-code-sm font-mono">2</span>
            </div>
          </div>
        </div>

        {/* Form Header */}
        <h1 className="text-code-lg text-primary font-mono text-center mb-6">
          {step === 1 ? 'Create Account' : 'Verify Email'}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-code">
            <p className="text-red-400 text-code-sm font-mono">{error}</p>
          </div>
        )}

        <div className="relative">
          <div
            className={`transition-opacity duration-300 ${step === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'}`}
          >
            <form onSubmit={handleSubmitForm} className="space-y-4">
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
                  placeholder="John"
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
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-code-sm text-gray-300 font-mono mb-1">
                College/University
              </label>
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-code px-3 py-2 text-code-base text-gray-100 font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="MIT (optional)"
              />
            </div>

            <div>
              <label className="block text-code-sm text-gray-300 font-mono mb-1">
                LeetCode Username
              </label>
              <input
                type="text"
                name="leetcodeUsername"
                value={formData.leetcodeUsername}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-code px-3 py-2 text-code-base text-gray-100 font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="leetcode_john"
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
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-code-sm text-gray-300 font-mono mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
                className="w-full bg-gray-900 border border-gray-700 rounded-code px-3 py-2 text-code-base text-gray-100 font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-code-sm text-gray-300 font-mono mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength="8"
                className="w-full bg-gray-900 border border-gray-700 rounded-code px-3 py-2 text-code-base text-gray-100 font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="Re-enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-mono text-code-base py-2 px-4 rounded-code transition-colors disabled:opacity-50"
            >
              Request OTP
            </button>
            </form>
          </div>
          <div
            className={`transition-opacity duration-300 ${step === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'}`}
          >
            <form onSubmit={handleSubmitOtp} className="space-y-4">
              <div>
              <p className="text-code-sm text-gray-300 font-mono mb-4">
                A 6-digit code was sent to{' '}
                <span className="text-primary">{formData.email}</span>. Enter it below:
              </p>

              <label className="block text-code-sm text-gray-300 font-mono mb-1">
                Verification Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                pattern="\d{6}"
                maxLength="6"
                className="w-full bg-gray-900 border border-gray-700 rounded-code px-3 py-2 text-code-base text-gray-100 font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50 text-center tracking-widest"
                placeholder="123456"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-mono text-code-base py-2 px-4 rounded-code transition-colors disabled:opacity-50"
            >
              Complete Registration
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full border border-gray-700 text-gray-300 font-mono text-code-base py-2 px-4 rounded-code transition-colors hover:bg-gray-800/50"
            >
              Back
            </button>
            </form>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center">
          <p className="text-code-sm text-gray-400 font-mono">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Login instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
