import React from 'react'
import { useAuth } from '../context/AuthContext'
import CompanyProgress from '../components/CompanyProgress'

export default function Home() {
  const { user } = useAuth()

  const exampleData = [
    { bucket: 'Easy', total: 25, solved: 15 },
    { bucket: 'Medium', total: 50, solved: 8 },
    { bucket: 'Hard', total: 25, solved: 3 },
  ]

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

      <CompanyProgress data={exampleData} />

      <div className="bg-surface rounded-card p-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-medium">Get started with your journey</h3>
            <p className="text-gray-400 text-sm">Explore different companies and their interview questions</p>
          </div>
          <button
            className="bg-secondary hover:bg-secondary/90 text-white py-2 px-4 rounded-code font-mono text-code-base"
            onClick={() => alert('Use the sidebar to navigate between companies')}
          >
            Explore Companies
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface rounded-card p-card">
          <h3 className="text-lg font-medium mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left bg-primary hover:bg-primary/90 text-white py-2 px-3 rounded-code text-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
              </svg>
              View all questions
            </button>
            <button className="w-full text-left bg-secondary hover:bg-secondary/90 text-white py-2 px-3 rounded-code text-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Review marked questions
            </button>
          </div>
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
