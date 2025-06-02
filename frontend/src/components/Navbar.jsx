// src/components/Navbar.jsx

import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Make sure your logo file is in ../assets/logo.png (or adjust path accordingly)
import logo from '../assets/logo.png'

export default function Navbar({ sidebarOpen, toggleSidebar }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // ─── State for Mobile Menu (“Import / Profile / Settings / Logout”) ─────────
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const toggleMenu = () => setIsMenuOpen(prev => !prev)

  // ─── State for Desktop Avatar Dropdown ───────────────────────────────────────
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const toggleUserMenu = () => setIsUserMenuOpen(prev => !prev)

  // ─── Click‐outside listener for Desktop Avatar Dropdown ──────────────────────
  const userMenuRef = useRef(null)
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuRef])

  // ─── Compute Avatar Initial (“T” if firstName is “Tavish”, or first letter of email) ─
  const avatarInitial = user
    ? (user.firstName
        ? user.firstName.charAt(0).toUpperCase()
        : user.email.charAt(0).toUpperCase())
    : ''

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-gray-800 shadow-elevation">
      {/* 
        Use a relative container so that the logo can be absolutely centered.
        Everything else (sidebar toggle, avatar) remains in normal flex flow.
      */}
      <div className="relative flex items-center h-16 px-card">
        {/* ─── Left: Sidebar‐toggle (always visible) ─────────────────────────────────── */}
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-gray-100 focus:outline-none mr-4"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              // Chevron-Left Icon
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            ) : (
              // Chevron-Right Icon
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19l7-7-7-7"
                />
              </svg>
            )}
          </button>
        </div>

        {/* ─── Center: Logo (absolutely centered, non-interactive except for the actual <Link>) ─────────── */}
        <div className="absolute left-1/2 top-0 transform -translate-x-1/2 h-16 flex items-center pointer-events-none">
          <Link to="/" className="pointer-events-auto">
            <img
              src={logo}
              alt="LeetEase Logo"
              className="h-8 w-auto"
            />
          </Link>
        </div>

        {/* ─── Right: Avatar (Desktop & Mobile) ──────────────────────────────────── */}
        <div className="ml-auto flex items-center gap-code" ref={userMenuRef}>
          {user ? (
            <div className="relative flex items-center">
              {/* --- Desktop Avatar (hidden on mobile) --- */}
              <button
                onClick={toggleUserMenu}
                className="hidden md:flex h-8 w-8 rounded-full bg-gray-600 items-center justify-center text-white focus:outline-none"
                aria-label="Open user menu"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="avatar"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="font-mono text-code-base">
                    {avatarInitial}
                  </span>
                )}
              </button>

              {/* --- Mobile Avatar (replaces hamburger) --- */}
              <button
                onClick={toggleMenu}
                className="flex md:hidden h-8 w-8 rounded-full bg-gray-600 items-center justify-center text-white focus:outline-none ml-2"
                aria-label="Open mobile menu"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="avatar"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="font-mono text-code-base">
                    {avatarInitial}
                  </span>
                )}
              </button>

              {/* ─── Desktop Dropdown (Profile / Import / Settings / Logout) ───────────── */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-gray-700 rounded-code shadow-lg z-50">
                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block font-mono text-code-base text-gray-400 hover:text-gray-100 hover:bg-gray-800 px-4 py-2 rounded-t-code transition-colors duration-150"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/import"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block font-mono text-code-base text-gray-400 hover:text-gray-100 hover:bg-gray-800 px-4 py-2 transition-colors duration-150"
                  >
                    Import Questions
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block font-mono text-code-base text-gray-400 hover:text-gray-100 hover:bg-gray-800 px-4 py-2 transition-colors duration-150"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      setIsUserMenuOpen(false)
                    }}
                    className="w-full text-left font-mono text-code-base text-gray-400 hover:text-gray-100 hover:bg-gray-800 px-4 py-2 rounded-b-code transition-colors duration-150"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex md:items-center md:gap-2">
              <Link
                to="/login"
                className="font-mono text-code-sm bg-transparent hover:bg-gray-800 text-gray-400 hover:text-gray-100 px-3 py-1.5 rounded-code border border-gray-700 transition-colors duration-150"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="font-mono text-code-sm bg-primary hover:bg-[#2a7aeb] text-white px-3 py-1.5 rounded-code transition-colors duration-150"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ─── Mobile Menu Panel (Import / Profile / Settings / Logout) ───────────────── */}
      {isMenuOpen && user && (
        <div className="md:hidden bg-surface border-t border-gray-800">
          <div className="px-card py-2 space-y-1">
            <Link
              to="/import"
              className="block font-mono text-code-base text-gray-400 hover:text-gray-100 hover:bg-gray-800 px-3 py-2 rounded-code transition-colors duration-150"
              onClick={toggleMenu}
            >
              Import Questions
            </Link>
            <Link
              to="/profile"
              className="block font-mono text-code-base text-gray-400 hover:text-gray-100 hover:bg-gray-800 px-3 py-2 rounded-code transition-colors duration-150"
              onClick={toggleMenu}
            >
              Profile
            </Link>
            <Link
              to="/settings"
              className="block font-mono text-code-base text-gray-400 hover:text-gray-100 hover:bg-gray-800 px-3 py-2 rounded-code transition-colors duration-150"
              onClick={toggleMenu}
            >
              Settings
            </Link>
            <div className="pt-2 border-t border-gray-800">
              <button
                onClick={() => {
                  logout()
                  toggleMenu()
                }}
                className="w-full text-left font-mono text-code-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800 px-3 py-2 rounded-code transition-colors duration-150"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
