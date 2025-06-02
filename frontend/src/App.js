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
    // ─── This container is now 100vh tall and flex, column direction ───
    <div className="h-screen flex flex-col overflow-hidden bg-surface">
      {showToast && <SyncToast />}

      {/* ─── Navbar (60px high) ──────────────────────────────────────────── */}
      <Navbar
        sidebarOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(prev => !prev)}
      />

      {/* ─── Below Navbar: sidebar + main share remaining space ───────────── */}
      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Always render Sidebar; it will slide in/out on both mobile and desktop */}
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

  // Whenever a new sync starts, force the toast to show immediately.
  useEffect(() => {
    if (syncing) {
      setVisible(true)
    }
  }, [syncing])

  // Whenever syncResult changes (i.e. the sync finished),
  // show the toast and schedule a 10s hide.
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
