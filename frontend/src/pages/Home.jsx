import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import { fetchRecentBuckets } from '../api'


export default function Home() {
  const { user } = useAuth()

  const [recent, setRecent] = useState([])

  useEffect(() => {
    fetchRecentBuckets()
      .then(res => setRecent(res.data.data || []))
      .catch(() => setRecent([]))
  }, [])


  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.firstName || 'Friend'}!
        </h1>
        <p className="mt-2 text-gray-300 max-w-2xl">
          Select a company from the sidebar to view question buckets and track your progress. Mark questions as solved or take notes to keep track of your preparation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface rounded-card p-card">
          <h3 className="text-lg font-medium mb-2">Recent Buckets</h3>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-400">No recent activity.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((r) => (
                <Link
                  key={`${r.company}-${r.bucket}`}
                  to={`/company/${encodeURIComponent(r.company)}?bucket=${encodeURIComponent(r.bucket)}`}
                  className="block w-full text-left bg-primary hover:bg-primary/90 text-white py-2 px-3 rounded-code text-sm"
                >
                  {r.company} – {r.bucket}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface rounded-card p-card">
          <h3 className="text-lg font-medium mb-2">Your Stats</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-900 rounded p-2 flex flex-col items-center">
              <span className="text-xl font-medium">12</span>
              <span className="text-gray-400">Solved</span>
            </div>
            <div className="bg-gray-900 rounded p-2 flex flex-col items-center">
              <span className="text-xl font-medium">5</span>
              <span className="text-gray-400">Today</span>
            </div>
            <div className="bg-gray-900 rounded p-2 flex flex-col items-center">
              <span className="text-xl font-medium">3</span>
              <span className="text-gray-400">Streak</span>
            </div>
            <div className="bg-gray-900 rounded p-2 flex flex-col items-center">
              <span className="text-xl font-medium">78%</span>
              <span className="text-gray-400">Accuracy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
