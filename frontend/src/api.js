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

// ─── Settings‐related endpoints ───────────────────────────────────────────

// Fetch the current user's settings
export function getUserSettings() {
  return api.get('/profile/settings')
}

// Update the current user's settings (color, palette, leetUsername, syncOnStartup, etc.)
export function updateUserSettings(settings) {
  return api.patch('/profile/settings', settings)
}

// Trigger a LeetCode sync for the current user (used by AuthContext.syncBackground)
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
