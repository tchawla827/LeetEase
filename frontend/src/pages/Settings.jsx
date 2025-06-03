// src/pages/Settings.jsx

import React from 'react'
import { Outlet } from 'react-router-dom'

export default function Settings() {
  return (
    <div className="flex h-full">
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
