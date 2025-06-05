// src/components/Navbar.jsx

import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Adjust this import path if your logo is stored elsewhere
import logo from '../assets/logo.png'

export default function Navbar({
  sidebarOpen,
  toggleSidebar,
  closeSidebar, // callback from App to forcibly close the sidebar
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // ─── Mobile Menu (“Import / Profile / Settings / Logout”) ────────────
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // ─── Desktop Avatar Dropdown ─────────────────────────────────────────
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  // Separate state to keep the menu mounted during transition
  const [isUserMenuVisible, setIsUserMenuVisible] = useState(false)

  // We'll store the computed screen‐coordinates for the dropdown box
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, right: 0 })

  // Reference to the avatar button (so we can compute where to place the dropdown)
  const avatarButtonRef = useRef(null)

  // Reference to the dropdown portal container (so clicks “outside” can close it)
  const portalRef = useRef(null)

  // Utility to detect “mobile” (i.e. narrower than Tailwind’s md breakpoint)
  const isMobile = () => window.innerWidth < 768

  // Compute “open user menu” position and show portal (desktop only)
  const openUserMenu = () => {
    if (avatarButtonRef.current) {
      const rect = avatarButtonRef.current.getBoundingClientRect()
      setDropdownCoords({
        top: rect.bottom + window.scrollY,
        // “right” = distance from viewport’s right edge
        right: window.innerWidth - rect.right,
      })
      // Mount the menu before triggering the open state so CSS transitions run
      setIsUserMenuVisible(true)
      // Use rAF so the visibility change applies before the open class
      requestAnimationFrame(() => setIsUserMenuOpen(true))
    }
  }

  const closeUserMenu = () => {
    setIsUserMenuOpen(false)
    setTimeout(() => setIsUserMenuVisible(false), 300)
  }

  // Toggle desktop avatar dropdown (desktop only, because on mobile it's hidden)
  const toggleUserMenu = () => {
    if (isUserMenuOpen) {
      // Start closing animation then unmount after it completes
      closeUserMenu()
    } else {
      // On desktop, we do NOT close the sidebar—allow concurrent open.
      openUserMenu()
    }
  }

  // Toggle mobile profile menu: if we’re about to open it AND we’re on mobile,
  // then force the sidebar closed first.
  const toggleMenu = () => {
    setIsMenuOpen(prev => {
      if (!prev && isMobile()) {
        closeSidebar()
      }
      return !prev
    })
  }

  // Whenever you click anywhere on the page, if that click is outside
  // both the avatar button AND the portal, close the desktop dropdown.
  useEffect(() => {
    function handleClickOutside(event) {
      const clickedInsideAvatar =
        avatarButtonRef.current?.contains(event.target)
      const clickedInsidePortal =
        portalRef.current?.contains(event.target)

      if (!clickedInsideAvatar && !clickedInsidePortal) {
        closeUserMenu()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle sidebar toggle button: if we’re on mobile, also close the mobile menu.
  // On desktop, leave the desktop dropdown alone.
  const handleSidebarToggle = () => {
    if (isMobile()) {
      setIsMenuOpen(false)
    }
    toggleSidebar()
  }

  // Compute avatar initial (“T” from “Tavish” or first letter of user.email)
  const avatarInitial = user
    ? user.firstName
      ? user.firstName.charAt(0).toUpperCase()
      : user.email.charAt(0).toUpperCase()
    : ''

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-gray-800 shadow-elevation">
      <div className="relative flex items-center h-16 px-card">
        {/* ─── Left: Sidebar Toggle Button ───────────────────────────────────────── */}
        <div className="flex items-center">
          <button
            onClick={handleSidebarToggle}
            className="text-gray-400 hover:text-gray-100 focus:outline-none mr-4"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              // Chevron‐Left Icon
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
              // Chevron‐Right Icon
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

        {/* ─── Center: Logo ───────────────────────────────────────────────────────────── */}
        <div className="absolute left-1/2 top-0 transform -translate-x-1/2 h-16 flex items-center pointer-events-none">
          <Link to={user ? '/home' : '/'} className="pointer-events-auto">
            <img src={logo} alt="LeetEase Logo" className="h-8 w-auto" />
          </Link>
        </div>

        {/* ─── Right: Avatar (Desktop / Mobile) ──────────────────────────────────── */}
        <div className="ml-auto flex items-center gap-code">
          {user ? (
            <>
              {/* --- Desktop Avatar Button (hidden on mobile) --- */}
              <button
                ref={avatarButtonRef}
                onClick={toggleUserMenu}
                className="hidden md:flex h-10 w-10 rounded-full bg-gray-600 items-center justify-center text-white focus:outline-none"
                aria-label="Open user menu"
              >
                {user.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt="avatar"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="font-mono text-code-base">
                    {avatarInitial}
                  </span>
                )}
              </button>

              {/* --- Mobile Avatar Button (replaces hamburger) --- */}
              <button
                onClick={toggleMenu}
                className="flex md:hidden h-10 w-10 rounded-full bg-gray-600 items-center justify-center text-white focus:outline-none ml-2"
                aria-label="Open mobile menu"
              >
                {user.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt="avatar"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="font-mono text-code-base">
                    {avatarInitial}
                  </span>
                )}
              </button>
            </>
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

      {/* ─── Desktop Avatar Dropdown “Portal” ────────────────────────────────────────── */}
      {isUserMenuVisible &&
        ReactDOM.createPortal(
          <div
            ref={portalRef}
            className={`bg-surface border border-gray-700 rounded-code shadow-lg z-50 transform transition-all duration-300 ease-out ${
              isUserMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            style={{
              position: 'absolute',
              top: dropdownCoords.top + 'px',
              right: dropdownCoords.right + 'px',
              width: '12rem', // Tailwind “w-48” is 12rem
            }}
          >
            <Link
              to="/profile"
              onClick={closeUserMenu}
              className="block font-mono text-code-base text-gray-400 hover:text-gray-100 hover:bg-gray-800 px-4 py-2 rounded-t-code transition-colors duration-150"
            >
              Profile
            </Link>
            <Link
              to="/import"
              onClick={closeUserMenu}
              className="block font-mono text-code-base text-gray-400 hover:text-gray-100 hover:bg-gray-800 px-4 py-2 transition-colors duration-150"
            >
              Import Questions
            </Link>
            <Link
              to="/settings"
              onClick={closeUserMenu}
              className="block font-mono text-code-base text-gray-400 hover:text-gray-100 hover:bg-gray-800 px-4 py-2 transition-colors duration-150"
            >
              Settings
            </Link>
            <button
              onClick={() => {
                logout()
                closeUserMenu()
              }}
              className="w-full text-left font-mono text-code-base text-gray-400 hover:text-gray-100 hover:bg-gray-800 px-4 py-2 rounded-b-code transition-colors duration-150"
            >
              Logout
            </button>
          </div>,
          document.body
        )}

      {/* ─── Mobile Menu Panel ─────────────────────────────────────────────────────── */}
      {isMenuOpen && user && (
        <div className="md:hidden bg-surface border-t border-gray-800 z-50">
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
