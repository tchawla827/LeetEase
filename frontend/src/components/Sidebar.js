import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const { user }               = useAuth()
  const [filter, setFilter]    = useState('')
  const [companies, setCompanies] = useState([])
  const location               = useLocation()

  // extract active company slug from URL
  const activeCompany = decodeURIComponent(
    (location.pathname.split('/company/')[1] || '').split('/')[0]
  )

  // re-fetch whenever `user` changes
  useEffect(() => {
    if (!user) {
      // clear list on logout
      setCompanies([])
      return
    }

    api.get('/api/companies')
      .then(res => setCompanies(res.data))
      .catch(err => console.error('Failed to load companies', err))
  }, [user])

  // filter by prefix
  const prefix = filter.trim().toLowerCase()
  const filteredCompanies =
    prefix === ''
      ? companies
      : companies.filter(c =>
          c.toLowerCase().startsWith(prefix)
        )

  return (
    <aside
      style={{
        width:       220,
        borderRight: '1px solid #ddd',
        padding:     '1rem',
        boxSizing:   'border-box',
        height:      '100vh',
        overflowY:   'auto',
        background:  '#fafafa'
      }}
    >
      <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>Companies</h2>

      <input
        type="text"
        placeholder="Search companies…"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{
          width:        '100%',
          padding:      '0.5rem',
          marginBottom: '1rem',
          border:       '1px solid #ccc',
          borderRadius: '4px'
        }}
      />

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {filteredCompanies.map(company => {
          const isActive = company === activeCompany
          return (
            <li key={company} style={{ margin: '0.5rem 0' }}>
              <Link
                to={`/company/${encodeURIComponent(company)}`}
                style={{
                  textDecoration: 'none',
                  color:          isActive ? '#007bff' : '#333',
                  fontWeight:     isActive ? 'bold' : 'normal'
                }}
              >
                • {company}
              </Link>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
