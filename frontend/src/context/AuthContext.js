// src/context/AuthContext.js

import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api, {
  registerUser,
  verifyOtp,
  requestPasswordReset,
  resetPassword,
  getAccountProfile,
  updateAccountProfile,
  uploadProfilePhoto,
  deleteProfilePhoto,
  googleLogin
} from '../api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const navigate = useNavigate()

  // ─── Background‐sync helper ─────────────────────────────────────────────
  const syncBackground = async () => {
    setSyncResult(null)
    setSyncing(true)
    try {
      const res = await api.post('/profile/leetcode/sync')
      const count = res.data.synced
      setSyncResult(count)
      return count
    } finally {
      setSyncing(false)
    }
  }

  // ─── Save any user “settings” (color/palette, LeetCode username, syncOnStartup, etc.) ────────────────
  const saveSettings = async (settings) => {
    const res = await api.patch('/profile/settings', settings)
    const newSettings = res.data

    setUser((prev) => {
      const updated = { ...prev, settings: newSettings }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })

    return newSettings
  }

  // ─── On mount: restore from localStorage, then hit /auth/me ─────────────
  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      setUser(JSON.parse(stored))
    }

    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('user', JSON.stringify(res.data))

        // If LeetCode username exists and we haven’t synced yet, do a background sync
        if (!stored && res.data.leetcode_username) {
          syncBackground().catch(() => {})
        }
      })
      .catch(() => {
        setUser(null)
        localStorage.removeItem('user')
      })
      .finally(() => {
        setAuthChecked(true)
      })
  }, [])

  // ─── Expose a way to refresh the user object after profile edits ─────────
  const fetchAndSetUser = async () => {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
      localStorage.setItem('user', JSON.stringify(res.data))
    } catch {
      setUser(null)
      localStorage.removeItem('user')
    }
  }

  // ─── Registration: Step 1 (request OTP) ─────────────────────────────────
  // payload: { firstName, lastName?, college?, leetcodeUsername?, email, password }
  const register = async (payload) => {
    return registerUser(payload)
  }

  // ─── Registration: Step 2 (verify OTP) ──────────────────────────────────
  // payload: { otp }
  const verifyRegistrationOtp = async (payload) => {
    return verifyOtp(payload)
  }

  // ─── login + then sync if needed ────────────────────────────────────────
  const login = async (email, password) => {
    await api.post('/auth/login', { email, password })
    const res = await api.get('/auth/me')

    setUser(res.data)
    localStorage.setItem('user', JSON.stringify(res.data))

    if (res.data.leetcode_username) {
      syncBackground().catch(() => {})
    }
  }

  const loginWithGoogle = async (credential) => {
    await googleLogin(credential)
    const res = await api.get('/auth/me')

    setUser(res.data)
    localStorage.setItem('user', JSON.stringify(res.data))

    if (res.data.leetcode_username) {
      syncBackground().catch(() => {})
    }
  }

  // ─── logout + redirect ──────────────────────────────────────────────────
  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Logout error:', err)
        throw err
      }
    } finally {
      setUser(null)
      localStorage.removeItem('user')
      navigate('/login')
    }
  }

  // ─── Fetch account profile ───────────────────────────────────────────────
  const fetchAccountProfile = async () => {
    return getAccountProfile()
  }

  // ─── Update account fields ───────────────────────────────────────────────
  const editAccountProfile = async (payload) => {
    const res = await updateAccountProfile(payload)
    // After server returns updated user, update context immediately
    setUser(res.data)
    localStorage.setItem('user', JSON.stringify(res.data))
    return res.data
  }

  // ─── Upload or replace profile photo ────────────────────────────────────
  const changeProfilePhoto = async (formData) => {
    const res = await uploadProfilePhoto(formData)
    // Update context user.profilePhoto
    setUser((prev) => {
      const updated = { ...prev, profilePhoto: res.data.profilePhotoUrl }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
    return res.data.profilePhotoUrl
  }

  // ─── Remove existing profile photo ───────────────────────────────────────
  const removeProfilePhoto = async () => {
    await deleteProfilePhoto()
    setUser((prev) => {
      const updated = { ...prev, profilePhoto: null }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }

  // ─── Forgot password request ───────────────────────────────────────────
  const requestReset = async (email) => {
    await requestPasswordReset(email)
  }

  // ─── Finalize password reset ───────────────────────────────────────────
  const finalizeReset = async (token, newPassword) => {
    await resetPassword(token, newPassword)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        loginWithGoogle,
        logout,
        register,
        verifyRegistrationOtp,
        syncing,
        syncResult,
        syncBackground,
        saveSettings,
        fetchAndSetUser,
        fetchAccountProfile,
        editAccountProfile,
        changeProfilePhoto,
        removeProfilePhoto,
        requestReset,
        finalizeReset,
        authChecked,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
