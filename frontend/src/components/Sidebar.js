// frontend/src/components/Sidebar.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const [companies, setCompanies] = useState([]);
  const location = useLocation();
  const activeCompany = decodeURIComponent(location.pathname.split('/company/')[1] || '');

  useEffect(() => {
    axios
      .get('/api/companies')
      .then(res => setCompanies(res.data))
      .catch(err => console.error('Error fetching companies', err));
  }, []);

  return (
    <aside
      style={{
        width: 220,
        borderRight: '1px solid #ddd',
        padding: '1rem',
        boxSizing: 'border-box',
        height: '100vh',
        overflowY: 'auto',
        background: '#fafafa'
      }}
    >
      <h2 style={{ marginTop: 0 }}>Companies</h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {companies.map(company => {
          const isActive = company === activeCompany;
          return (
            <li key={company} style={{ margin: '0.5rem 0' }}>
              <Link
                to={`/company/${encodeURIComponent(company)}`}
                style={{
                  textDecoration: 'none',
                  color: isActive ? '#007bff' : '#333',
                  fontWeight: isActive ? 'bold' : 'normal'
                }}
              >
                {company}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
