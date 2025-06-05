import React from 'react'
import { Link } from 'react-router-dom'

const MailIcon = props => (
  <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
    <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
  </svg>
)

export default function Contact() {
  return (
    <div className="min-h-full flex flex-col text-gray-200 font-mono px-card py-section">
      <div className="max-w-2xl mx-auto flex-1 space-y-6">
        <h1 className="text-3xl font-bold">Contact</h1>
        <p className="text-gray-400">Have more company wise questions? Feel free to reach out.</p>
        <ul className="space-y-4">
          <li className="flex items-center space-x-3">
            <MailIcon />
            <a href="mailto:tavish.chawla.13@gmail.com" className="hover:underline text-gray-300">tavish.chawla.13@gmail.com</a>
          </li>
          <li className="flex items-center space-x-3">
            <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg" alt="LinkedIn" className="h-6 w-6 text-primary" />
            <a href="https://www.linkedin.com/in/tavish-chawla-3b1673278/" target="_blank" rel="noopener noreferrer" className="hover:underline text-gray-300">LinkedIn</a>
          </li>
          <li className="flex items-center space-x-3">
            <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg" alt="Instagram" className="h-6 w-6 text-primary" />
            <a href="https://www.instagram.com/tchawla827" target="_blank" rel="noopener noreferrer" className="hover:underline text-gray-300">@tchawla827</a>
          </li>
        </ul>
        <p className="text-gray-400">We would love to hear your feedback and suggestions.</p>
        <Link to="/" className="text-primary hover:underline">Back to Home</Link>
      </div>
    </div>
  )
}
