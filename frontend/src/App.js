// frontend/src/App.js

import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import PrivateRoute from './components/PrivateRoute'

import Login       from './pages/Login'
import Register    from './pages/Register'
import AdminImport from './pages/AdminImport'
import CompanyPage from './pages/CompanyPage'
import Profile     from './pages/Profile'

function AppContent() {
  const { syncing } = useAuth()

  return (
    <>
      {syncing && <SyncToast />}

      <Navbar />

      <div
        style={{
          display: 'flex',
          height: 'calc(100vh - 60px)',   // subtract navbar height
          paddingTop: '60px'               // push content below fixed navbar
        }}
      >
        <Sidebar />

        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem'
          }}
        >
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
    </>
  )
}

function SyncToast() {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
        <span>Syncing solved questions…</span>
      </div>
    </>
  )
}

function Welcome() {
  return (
    <div style={{ padding: '1rem' }}>
      <h2>Welcome to LeetEase</h2>
      <p>Select a company from the sidebar to get started.</p>
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
