import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-gray-800 shadow-elevation">
      <div className="flex items-center justify-between h-16 px-card">
        {/* Left: Brand/Logo */}
        <div className="flex-shrink-0">
          <Link 
            to="/" 
            className="font-mono text-code-base font-medium text-gray-100 hover:text-primary transition-colors duration-150"
          >
            LeetEase
          </Link>
        </div>

        {/* Center: Navigation Links (Desktop) - Only shown if user exists */}
        {user && (
          <nav className="hidden md:flex md:items-center md:gap-code">
            <Link
              to="/profile"
              className="font-mono text-code-base text-gray-400 hover:text-gray-100 px-3 py-2 rounded-code transition-colors duration-150"
            >
              Profile
            </Link>
            <Link
              to="/import"
              className="font-mono text-code-base text-gray-400 hover:text-gray-100 px-3 py-2 rounded-code transition-colors duration-150"
            >
              Import Questions
            </Link>
          </nav>
        )}

        {/* Right: User Section */}
        <div className="flex items-center gap-code">
          {user ? (
            <>
              <span className="hidden md:block font-mono text-code-base text-gray-300">
                {user.firstName || user.email}
              </span>
              <button
                onClick={logout}
                className="font-mono text-code-sm bg-transparent hover:bg-gray-800 text-gray-400 hover:text-gray-100 px-3 py-1.5 rounded-code border border-gray-700 transition-colors duration-150"
              >
                Logout
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
          
          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-gray-400 hover:text-gray-100 focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu - Only shown if user exists */}
      {isMenuOpen && user && (
        <div className="md:hidden bg-surface border-t border-gray-800">
          <div className="px-card py-2 space-y-1">
            <Link
              to="/profile"
              className="block font-mono text-code-base text-gray-400 hover:text-gray-100 hover:bg-gray-800 px-3 py-2 rounded-code transition-colors duration-150"
              onClick={toggleMenu}
            >
              Profile
            </Link>
            <Link
              to="/import"
              className="block font-mono text-code-base text-gray-400 hover:text-gray-100 hover:bg-gray-800 px-3 py-2 rounded-code transition-colors duration-150"
              onClick={toggleMenu}
            >
              Import Questions
            </Link>
            <div className="pt-2 border-t border-gray-800">
              <div className="font-mono text-code-sm text-gray-300 px-3 py-2">
                {user.firstName || user.email}
              </div>
              <button
                onClick={() => {
                  logout();
                  toggleMenu();
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
  );
}