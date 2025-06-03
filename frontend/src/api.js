// src/api.js

import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const needsCsrf = /^(post|put|patch|delete)$/i.test(config.method)
    if (needsCsrf) {
      const csrf = Cookies.get('csrf_access_token')
      if (csrf) {
        config.headers['X-CSRF-TOKEN'] = csrf
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Authentication / Registration Endpoints ────────────────────────────

// Step 1: Request OTP (register user)
// Expects payload: { firstName, lastName?, college?, leetcodeUsername?, email, password }
export function registerUser(payload) {
  return api.post('/auth/register', payload)
}

// Step 2: Verify OTP
// Expects payload: { otp }
export function verifyOtp(payload) {
  return api.post('/auth/verify', payload)
}

// ─── Account Settings & Profile Photo Endpoints ───────────────────────────

// Fetch the current user's full profile (firstName, lastName, college, email, profilePhoto, etc.)
export function getAccountProfile() {
  return api.get('/profile/account')
}

// Update account fields (firstName, lastName, college, email, optionally newPassword)
export function updateAccountProfile(payload) {
  return api.patch('/profile/account', payload)
}

// Upload (or replace) profile photo (multipart/form-data)
export function uploadProfilePhoto(formData) {
  return api.post('/profile/account/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// Delete existing profile photo
export function deleteProfilePhoto() {
  return api.delete('/profile/account/photo')
}

// ─── Settings‐related endpoints ───────────────────────────────────────────

// Fetch the current user's settings (color, palette, leetUsername, etc.)
export function getUserSettings() {
  return api.get('/profile/settings')
}

// Update the current user's settings (color, palette, leetUsername, syncOnStartup, etc.)
export function updateUserSettings(settings) {
  return api.patch('/profile/settings', settings)
}

// Trigger a LeetCode sync for the current user
export function syncLeetCode() {
  return api.post('/profile/leetcode/sync')
}

// ─── Existing code ───────────────────────────────────────────────────────

// Fetch progress data for a given company
export function fetchCompanyProgress(companyName) {
  const path = `/api/companies/${encodeURIComponent(companyName)}/progress`
  return api.get(path)
}

export default api
