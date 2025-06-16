// src/components/Navbar.jsx

import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

// Adjust this import path if your logo is stored elsewhere
import logo from '../assets/logo.svg'

export default function Navbar({
  sidebarOpen,
  toggleSidebar,
  closeSidebar, // callback from App to forcibly close the sidebar
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  // ─── Mobile Menu (“Import / Profile / Settings / Logout”) ────────────
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // Keep menu mounted during transition
  const [isMenuVisible, setIsMenuVisible] = useState(false)

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

  // Reference to the mobile dropdown panel
  const menuRef = useRef(null)

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

  // ----- Mobile Menu Helpers -----
  const openMenu = () => {
    if (isMobile()) closeSidebar()
    // Mount before starting animation
    setIsMenuVisible(true)
    requestAnimationFrame(() => setIsMenuOpen(true))
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
    setTimeout(() => setIsMenuVisible(false), 300)
  }

  // Toggle mobile profile menu
  const toggleMenu = () => {
    if (isMenuOpen) {
      closeMenu()
    } else {
      openMenu()
    }
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
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  // Close the mobile menu when tapping/clicking outside of it
  useEffect(() => {
    if (!isMenuOpen) return
    function handleMenuOutside(event) {
      const clickedInsideAvatar = avatarButtonRef.current?.contains(event.target)
      const clickedInsideMenu = menuRef.current?.contains(event.target)
      if (!clickedInsideAvatar && !clickedInsideMenu) {

        closeMenu()

      }
    }
    document.addEventListener('mousedown', handleMenuOutside)
    document.addEventListener('touchstart', handleMenuOutside)
    return () => {
      document.removeEventListener('mousedown', handleMenuOutside)
      document.removeEventListener('touchstart', handleMenuOutside)
    }
  }, [isMenuOpen])

  // Handle sidebar toggle button: if we’re on mobile, also close the mobile menu.
  // On desktop, leave the desktop dropdown alone.
  const handleSidebarToggle = () => {
    if (isMobile()) {
      closeMenu()
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
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-gray-200 dark:bg-surface text-gray-900 dark:text-gray-100 border-b border-gray-800 shadow-elevation"
    >
      <div className="relative flex items-center h-16 px-card">
        {/* ─── Left: Sidebar Toggle Button ───────────────────────────────────────── */}
        {user && (
          <div className="flex items-center">
            <button
            onClick={handleSidebarToggle}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none mr-4"
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
        )}

        {/* ─── Center: Logo ───────────────────────────────────────────────────────────── */}
        <div className="absolute left-1/2 top-0 transform -translate-x-1/2 h-16 flex items-center pointer-events-none">
          <Link to={user ? '/home' : '/'} className="pointer-events-auto">
            <img src={logo} alt="LeetEase Logo" className="h-14 w-auto" />
          </Link>
        </div>

        {/* ─── Right: Avatar (Desktop / Mobile) ──────────────────────────────────── */}
        <div className="ml-auto flex items-center gap-code">
          <button
            onClick={toggleTheme}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m8.66-11.66l-.71.71M4.05 19.95l-.71-.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.05l-.71.71M12 5a7 7 0 100 14 7 7 0 000-14z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                />
              </svg>
            )}
          </button>
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
                to="/contact"
                className="font-mono text-code-sm bg-transparent hover:bg-gray-300 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-1.5 rounded-code border border-gray-700 transition-colors duration-150"
              >
                Contact
              </Link>
              <Link
                to="/login"
                className="font-mono text-code-sm bg-transparent hover:bg-gray-300 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-1.5 rounded-code border border-gray-700 transition-colors duration-150"
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
            className={`bg-gray-200 dark:bg-surface border border-gray-700 rounded-code shadow-lg z-50 transform transition-all duration-300 ease-out ${
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
              className="block font-mono text-code-base text-gray-700 hover:bg-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 px-4 py-2 rounded-t-code transition-colors duration-150"
            >
              Profile
            </Link>
            <Link
              to="/search"
              onClick={closeUserMenu}
              className="block font-mono text-code-base text-gray-700 hover:bg-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 px-4 py-2 transition-colors duration-150"
            >
              Search Questions
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/import"
                onClick={closeUserMenu}
                className="block font-mono text-code-base text-gray-700 hover:bg-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 px-4 py-2 transition-colors duration-150"
              >
                Import Questions
              </Link>
            )}
            <Link
              to="/settings"
              onClick={closeUserMenu}
              className="block font-mono text-code-base text-gray-700 hover:bg-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 px-4 py-2 transition-colors duration-150"
            >
              Settings
            </Link>
            <Link
              to="/contact"
              onClick={closeUserMenu}
              className="block font-mono text-code-base text-gray-700 hover:bg-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 px-4 py-2 transition-colors duration-150"
            >
              Contact
            </Link>
            <button
              onClick={() => {
                logout()
                closeUserMenu()
              }}
              className="w-full text-left font-mono text-code-base text-gray-700 hover:bg-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 px-4 py-2 rounded-b-code transition-colors duration-150"
            >
              Logout
            </button>
          </div>,
          document.body
        )}

      {/* ─── Mobile Menu Panel ─────────────────────────────────────────────────────── */}

        {isMenuVisible && user && (
          <div
            ref={menuRef}
            className={`md:hidden bg-gray-200 dark:bg-surface border-t border-gray-800 z-50 origin-top transform transition-all duration-300 ease-out ${
              isMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'
            }`}

          >
            <div className="px-card py-2 space-y-1">
            {user?.role === 'admin' && (
              <Link
                to="/import"
                className="block font-mono text-code-base text-gray-700 hover:bg-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 px-3 py-2 rounded-code transition-colors duration-150"
                onClick={toggleMenu}
              >
                Import Questions
              </Link>
            )}
            <Link
              to="/profile"
              className="block font-mono text-code-base text-gray-700 hover:bg-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 px-3 py-2 rounded-code transition-colors duration-150"
              onClick={toggleMenu}
            >
              Profile
            </Link>
            <Link
              to="/search"
              className="block font-mono text-code-base text-gray-700 hover:bg-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 px-3 py-2 rounded-code transition-colors duration-150"
              onClick={toggleMenu}
            >
              Search Questions
            </Link>
            <Link
              to="/settings"
              className="block font-mono text-code-base text-gray-700 hover:bg-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 px-3 py-2 rounded-code transition-colors duration-150"
              onClick={toggleMenu}
            >
              Settings
            </Link>
            <Link
              to="/contact"
              className="block font-mono text-code-base text-gray-700 hover:bg-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 px-3 py-2 rounded-code transition-colors duration-150"
              onClick={toggleMenu}
            >
              Contact
            </Link>
            <div className="pt-2 border-t border-gray-800">
              <button
                onClick={() => {
                  logout()
                  toggleMenu()
                }}
                className="w-full text-left font-mono text-code-sm text-gray-700 hover:bg-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 px-3 py-2 rounded-code transition-colors duration-150"
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
