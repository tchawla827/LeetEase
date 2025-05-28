import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [syncing, setSyncing] = useState(false)

  // background‐sync helper (returns count)
  const syncBackground = async () => {
    console.log('[sync] starting')
    setSyncing(true)
    try {
      const res = await api.post('/profile/leetcode/sync')
      return res.data.synced
    } catch (err) {
      console.error('[sync] error', err)
      throw err
    } finally {
      console.log('[sync] finished')
      setSyncing(false)
    }
  }

  // on mount: restore user, refresh profile, then background‐sync
  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      setUser(JSON.parse(stored))
    }
    api.get('/auth/me')
      .then(res => {
        setUser(res.data)
        localStorage.setItem('user', JSON.stringify(res.data))
        if (res.data.leetcode_username) {
          // fire-and-forget:
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
    <AuthContext.Provider value={{ user, login, logout, syncing, syncBackground }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
