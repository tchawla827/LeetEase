// src/components/SettingsSidebar.js

import React from 'react'
import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: 'account',   label: 'Account' },
  { to: 'color',     label: 'Color' },
  { to: 'leetcode',  label: 'LeetCode' },
]

export default function SettingsSidebar({ sidebarOpen }) {
  return (
    <aside
      className={`
        /* ───────────────────────────────────────────────────────── */
        /* On mobile (< md): fixed sidebar under the Navbar  */
        fixed top-16 left-0 bottom-0 z-50

        /* Basic sidebar styling */
        bg-surface border-r border-gray-800 shadow-elevation
        overflow-y-auto sidebar-scroll

        transform transition-all duration-300 opacity-0
        ${sidebarOpen ? 'opacity-100 w-64 translate-x-0' : 'opacity-0 w-0 -translate-x-full'}

        /* On desktop (>= md): revert to a normal in-flow element */
        md:relative md:top-0 md:block
        /* ───────────────────────────────────────────────────────── */
      `}
    >
      <div className="pt-2 px-card">
        {/* Sidebar header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h2>
        </div>

        {/* Links */}
        <nav className="mt-4 flex-1 overflow-y-auto px-2">
          <ul className="space-y-1">
            {LINKS.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={`/settings/${to}`}
                  className={({ isActive }) =>
                    `group flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-800 hover:bg-gray-300 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  )
}
