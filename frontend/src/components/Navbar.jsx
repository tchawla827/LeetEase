import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <Link to="/">LeetEase</Link>
      </div>

      <nav className="navbar__links">
        {user && (
          <>
            <Link to="/profile">Profile</Link>
            <Link to="/import">Import Questions</Link>
          </>
        )}
      </nav>

      <div className="navbar__user">
        {user ? (
          <>
            <span>{user.firstName || user.email}</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </header>
  )
}
