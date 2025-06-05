import React from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-gray-200 font-mono">

      {/* Hero */}
      <section className="hero-gradient flex flex-col items-center justify-center text-center py-section px-card flex-grow">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Ace technical interviews,<br className="hidden md:block" />
          <span className="text-primary">company by company</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mb-10">
          The personalized platform to track, practice and master coding interview questions from top tech companies.
        </p>
        <div className="flex space-x-4">
          <Link to="/register" className="px-6 py-3 rounded-code bg-primary text-white hover:bg-primary/90 transition-colors">Get Started</Link>
          <Link to="/login" className="px-6 py-3 rounded-code border border-gray-600 hover:bg-gray-800 transition-colors">Login</Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-background py-section px-card">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Your Complete Interview Preparation Companion</h2>
            <ul className="space-y-4">
              <li className="feature-bullet pl-4">Track interview questions by company and bucket</li>
              <li className="feature-bullet pl-4">Mark questions solved or rate their difficulty</li>
              <li className="feature-bullet pl-4">View analytics and progress charts</li>
              <li className="feature-bullet pl-4">Sync solved problems from LeetCode automatically</li>
              <li className="feature-bullet pl-4">AI-powered question recommendations</li>
            </ul>
          </div>
          <div className="dashboard-placeholder rounded-xl p-2">
            <div className="bg-surface rounded-lg h-64" />
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="bg-surface py-section px-card text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to level up your interview game?</h2>
        <p className="text-gray-400 mb-8">Join thousands of developers who have aced their technical interviews with LeetEase.</p>
        <Link to="/register" className="px-6 py-3 rounded-code bg-primary text-white hover:bg-primary/90 transition-colors">Start for Free</Link>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-gray-800 py-8 px-card">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <img src={logo} alt="LeetEase logo" className="h-6 w-6" />
            <span>Leet<span className="text-primary">Ease</span></span>
          </div>
          <div>&copy; 2023 LeetEase. Open source on <a href="https://github.com/leetease" className="text-primary hover:underline">GitHub</a>.</div>
        </div>
      </footer>
    </div>
  )
}

