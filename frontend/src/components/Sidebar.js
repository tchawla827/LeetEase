import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Sidebar() {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    axios.get('/api/companies')
      .then(res => setCompanies(res.data))
      .catch(err => console.error('Error fetching companies', err));
  }, []);

  return (
    <aside style={{ width: 200, borderRight: '1px solid #ddd', padding: '1rem' }}>
      <h2>Companies</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {companies.map(c => (
          <li key={c} style={{ margin: '0.5rem 0' }}>
            <Link to={`/company/${encodeURIComponent(c)}`}>{c}</Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
