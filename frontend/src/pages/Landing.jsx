import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.svg'

export default function Landing() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
  return (
    <div className="min-h-full flex flex-col font-mono text-gray-900 dark:text-gray-200">

      {/* Hero */}
      <section className="hero-gradient flex flex-col items-center justify-center text-center py-section px-card flex-grow reveal opacity-0 translate-y-4">
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
      <section className="py-section px-card reveal opacity-0 translate-y-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Your Complete Interview Preparation Companion</h2>
            <ul className="space-y-4">
              <li className="feature-bullet pl-4">Curated interview questions from hundreds of tech companies</li>
              <li className="feature-bullet pl-4">Mark problems solved, rate difficulty and add notes</li>
              <li className="feature-bullet pl-4">Visualize your progress with dashboards and topic charts</li>
              <li className="feature-bullet pl-4">Sync solved questions from your LeetCode account automatically</li>
              <li className="feature-bullet pl-4">Personalize your profile photo and color palette</li>
            </ul>
          </div>
          <div className="dashboard-placeholder rounded-xl p-2">
            <div className="bg-surface rounded-lg h-64" />
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="bg-surface py-section px-card text-center reveal opacity-0 translate-y-4">
        <h2 className="text-3xl font-bold mb-6">Ready to level up your interview game?</h2>
        <p className="text-gray-400 mb-8">Join thousands of developers who have aced their technical interviews with LeetEase.</p>
        <Link to="/register" className="px-6 py-3 rounded-code bg-primary text-white hover:bg-primary/90 transition-colors">Start for Free</Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-300 dark:border-gray-800 py-8 px-card">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <img src={logo} alt="LeetEase logo" className="h-16 w-auto" />
          </div>
          <div>
            &copy; 2023 LeetEase. Open source on
            <a href="https://github.com/leetease" className="text-primary hover:underline ml-1">GitHub</a>.
            <Link to="/contact" className="text-primary hover:underline ml-2">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

