import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchRecentBuckets } from '../api'
import UserStats from '../components/UserStats'
import CompanyStats from '../components/CompanyStats'



export default function Home() {
  const { user } = useAuth()

  const [recent, setRecent] = useState([])

  useEffect(() => {
    fetchRecentBuckets(8)
      .then(res => setRecent(res.data.data || []))
      .catch(() => setRecent([]))
  }, [])


  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.firstName || 'Friend'}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl">
          Select a company from the sidebar to view question buckets and track your progress. Mark questions as solved or take notes to keep track of your preparation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface rounded-card p-card">
          <h3 className="text-lg font-medium mb-4">Recent Buckets</h3>

          {recent.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400">No recent activity yet.</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Start exploring companies to see your history here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((r) => (
                <Link
                  key={`${r.company}-${r.bucket}`}
                  to={`/company/${encodeURIComponent(r.company)}?bucket=${encodeURIComponent(r.bucket)}`}
                  className="group block bg-background hover:bg-primary/5 dark:hover:bg-primary/10 rounded-lg p-3 transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {r.company}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {r.bucket}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-600 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>

        <div className="bg-surface rounded-card p-card">
          <h3 className="text-lg font-medium mb-2">Your Stats</h3>
          <UserStats />
        </div>

        <div className="bg-surface rounded-card p-card md:col-span-2">
          <h3 className="text-lg font-medium mb-2">Company Progress</h3>
          <CompanyStats />

        </div>
      </div>
    </div>
  )
}
