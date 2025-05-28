// frontend/src/context/AuthContext.js

import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [syncing, setSyncing]     = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  // background‐sync helper (returns count)
  const syncBackground = async () => {
    setSyncResult(null)
    setSyncing(true)
    try {
      const res   = await api.post('/profile/leetcode/sync')
      const count = res.data.synced
      setSyncResult(count)
      return count
    } finally {
      setSyncing(false)
    }
  }

  // On mount: restore user, fetch profile—but NO auto-sync here
  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      setUser(JSON.parse(stored))
    }
    api.get('/auth/me')
      .then(res => {
        setUser(res.data)
        localStorage.setItem('user', JSON.stringify(res.data))
        // only sync on first-ever boot if no stored user:
        if (!stored && res.data.leetcode_username) {
          syncBackground().catch(() => {})
        }
      })
      .catch(() => {
        setUser(null)
        localStorage.removeItem('user')
      })
  }, [])

  // login + then background‐sync
  const login = async (email, password) => {
    await api.post('/auth/login', { email, password })
    const res = await api.get('/auth/me')
    setUser(res.data)
    localStorage.setItem('user', JSON.stringify(res.data))
    if (res.data.leetcode_username) {
      syncBackground().catch(() => {})
    }
  }

  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      syncing,
      syncResult,
      syncBackground
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
