// src/components/SettingsSidebar.js

import React from 'react'
import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: 'account',   label: 'Account' },
  { to: 'color',     label: 'Color' },
  { to: 'leetcode',  label: 'LeetCode' },
]

export default function SettingsSidebar() {
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-surface border-r border-gray-800 h-full">
        {/* Sidebar header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-100">Settings</h2>
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
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
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
    </div>
  )
}
