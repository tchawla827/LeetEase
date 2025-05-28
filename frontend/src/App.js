// frontend/src/App.js

import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

import Sidebar from './components/Sidebar'
import PrivateRoute from './components/PrivateRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import AdminImport from './pages/AdminImport'
import CompanyPage from './pages/CompanyPage'
import Profile from './pages/Profile'   // ← New import

function App() {
  return (
    <Router>
      <AuthProvider>
        <div style={{ display: 'flex', height: '100vh' }}>
          {/* Left pane: Sidebar includes navigation and Logout */}
          <Sidebar />

          {/* Right pane: routed views */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Admin-only CSV import */}
              <Route
                path="/import"
                element={
                  <PrivateRoute>
                    <AdminImport />
                  </PrivateRoute>
                }
              />

              {/* Company-specific questions (authenticated) */}
              <Route
                path="/company/:companyName"
                element={
                  <PrivateRoute>
                    <CompanyPage />
                  </PrivateRoute>
                }
              />

              {/* User profile */}
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />

              {/* Authenticated fallback landing */}
              <Route
                path="*"
                element={
                  <PrivateRoute>
                    <div style={{ padding: '1rem' }}>
                      <h2>Welcome to LeetEase</h2>
                      <p>Select a company from the sidebar to get started.</p>
                    </div>
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
