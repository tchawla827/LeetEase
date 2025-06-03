// src/App.js

import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Navbar       from './components/Navbar'
import Sidebar      from './components/Sidebar'
import PrivateRoute from './components/PrivateRoute'

import Login        from './pages/Login'
import Register     from './pages/Register'
import AdminImport  from './pages/AdminImport'
import CompanyPage  from './pages/CompanyPage'
import Profile      from './pages/Profile'

function AppContent() {
  // ─── Sidebar open/closed state ─────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { syncing, syncResult } = useAuth()
  const showToast = syncing || syncResult != null

  return (
    // (Note: we have already removed overflow-hidden so dropdowns aren’t clipped)
    <div className="h-screen flex flex-col bg-surface">
      {showToast && <SyncToast />}

      {/* ─── Navbar (60px high) ──────────────────────────────────────────── */}
      <Navbar
        sidebarOpen={sidebarOpen}
        toggleSidebar={() => {
          // Whenever we toggle the sidebar, we leave the profile-dropdown state alone.
          // Navbar will handle closing its own dropdown if needed via props.
          setSidebarOpen(prev => !prev)
        }}
        closeSidebar={() => {
          // This callback allows Navbar to forcibly close the sidebar
          setSidebarOpen(false)
        }}
      />

      {/* ─── Below Navbar: sidebar + main share remaining space ───────────── */}
      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Sidebar will slide in/out on both mobile and desktop */}
        <Sidebar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto p-4">
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/import"
              element={
                <PrivateRoute>
                  <AdminImport />
                </PrivateRoute>
              }
            />

            <Route
              path="/company/:companyName"
              element={
                <PrivateRoute>
                  <CompanyPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />

            <Route
              path="*"
              element={
                <PrivateRoute>
                  <Welcome />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  )
}


function SyncToast() {
  const { syncing, syncResult } = useAuth()
  const [visible, setVisible] = useState(false)

  // Whenever a new sync starts, show the toast immediately.
  useEffect(() => {
    if (syncing) {
      setVisible(true)
    }
  }, [syncing])

  // When syncResult changes (sync finished), show toast and hide after 10s.
  useEffect(() => {
    let timerId
    if (syncResult !== null) {
      setVisible(true)
      timerId = setTimeout(() => {
        setVisible(false)
      }, 10000)
    }
    return () => {
      clearTimeout(timerId)
    }
  }, [syncResult])

  if (!visible) return null

  const text = syncing
    ? 'Syncing solved questions…'
    : `Synced ${syncResult} questions`

  return (
    <div
      className="fixed bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-code p-2 pl-3 shadow-elevation-md flex items-center z-50 text-gray-100"
    >
      {syncing && (
        <div
          className="mr-2 border-2 border-gray-600 border-t-primary rounded-full w-4 h-4 animate-spin"
          style={{ animation: 'spin 1s linear infinite' }}
        />
      )}
      <span className="pr-3">{text}</span>

      {/* Close button */}
      <button
        onClick={() => setVisible(false)}
        className="ml-auto text-gray-400 hover:text-gray-200"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  )
}


function Welcome() {
  return (
    <div>
      <h2 className="text-xl text-gray-100">Welcome to LeetEase</h2>
      <p className="text-gray-300">Select a company from the sidebar to get started.</p>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}
