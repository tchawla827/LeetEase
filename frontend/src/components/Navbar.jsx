// frontend/src/components/Navbar.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'          // ← import the styles

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <Link to="/">LeetEase</Link>
      </div>

      <nav className="navbar__links">
        <Link to="/profile">Profile</Link>
        <Link to="/import">Import Questions</Link>
      </nav>

      <div className="navbar__user">
        <span>{user?.firstName || '—'}</span>
        <button onClick={logout}>Logout</button>
      </div>
    </header>
  )
}
