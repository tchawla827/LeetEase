// frontend/src/context/AuthContext.js

import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [syncing, setSyncing] = useState(false)

  // helper to fire off background sync
  const syncBackground = () => {
  console.log('[sync] starting')       //  ← add
  setSyncing(true)

  api.post('/profile/leetcode/sync')
    .catch(() => {})
    .finally(() => {
      console.log('[sync] finished')   //  ← add
      setSyncing(false)
    })
}


  // on mount, restore user & then refresh + kick off a sync if logged in
  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      setUser(JSON.parse(stored))
    }
    api.get('/auth/me')
      .then(res => {
        setUser(res.data)
        localStorage.setItem('user', JSON.stringify(res.data))
        // if they have a leetcode handle, sync in bg
        if (res.data.leetcode_username) syncBackground()
      })
      .catch(() => {
        setUser(null)
        localStorage.removeItem('user')
      })
  }, [])

  // login + then fire off sync in BG
  const login = async (email, password) => {
    await api.post('/auth/login', { email, password })
    const res = await api.get('/auth/me')
    setUser(res.data)
    localStorage.setItem('user', JSON.stringify(res.data))
    if (res.data.leetcode_username) syncBackground()
  }

  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, syncing }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
