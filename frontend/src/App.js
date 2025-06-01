// src/App.js

import React, { useState } from 'react'
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
        {sidebarOpen && <Sidebar />}

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
  const text = syncing
    ? 'Syncing solved questions…'
    : `Synced ${syncResult} questions`

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div
        style={{
          position:     'fixed',
          bottom:       '1rem',
          right:        '1rem',
          background:   '#fff',
          border:       '1px solid #ccc',
          borderRadius: '4px',
          padding:      '0.5rem 1rem',
          boxShadow:    '0 2px 6px rgba(0,0,0,0.1)',
          display:      'flex',
          alignItems:   'center',
          zIndex:       9999
        }}
      >
        {syncing && (
          <div
            style={{
              marginRight: '0.5rem',
              border:      '2px solid #ddd',
              borderTop:   '2px solid #333',
              borderRadius:'50%',
              width:       '1rem',
              height:      '1rem',
              animation:   'spin 1s linear infinite'
            }}
          />
        )}
        <span>{text}</span>
      </div>
    </>
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
