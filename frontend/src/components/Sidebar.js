import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('');
  const [companies, setCompanies] = useState([]);
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const location = useLocation();

  // extract active company slug from URL
  const activeCompany = decodeURIComponent(
    (location.pathname.split('/company/')[1] || '').split('/')[0]
  );

  // re-fetch whenever `user` changes
  useEffect(() => {
    if (!user) {
      // clear list on logout
      setCompanies([]);
      return;
    }

    api.get('/api/companies')
      .then(res => setCompanies(res.data))
      .catch(err => console.error('Failed to load companies', err));
  }, [user]);

  // filter by prefix
  const prefix = filter.trim().toLowerCase();
  const filteredCompanies =
    prefix === ''
      ? companies
      : companies.filter(c =>
          c.toLowerCase().startsWith(prefix)
        );

  const toggleCompany = (company) => {
    setExpandedCompanies(prev => ({
      ...prev,
      [company]: !prev[company]
    }));
  };

  const handleBucketClick = (company, bucket) => {
    console.log(`Selected ${bucket} for ${company}`);
    // Your bucket click handler logic here
  };

  const timeBuckets = [
    '30 Days',
    '3 Months',
    '6 Months',
    'More Than 6 Months',
    'All'
  ];

  return (
    <aside className="hidden md:block fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-surface border-r border-gray-800 shadow-elevation overflow-y-auto px-card py-2">
      <h2 className="font-mono text-code-base text-gray-100 mb-2">Companies</h2>

      <input
        type="text"
        placeholder="Search companies…"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="font-mono text-code-sm w-full px-3 py-1.5 mb-2 rounded-code border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
      />

      <ul className="space-y-1">
        {filteredCompanies.map(company => {
          const isActive = company === activeCompany;
          const isExpanded = expandedCompanies[company];

          return (
            <li key={company} className="flex flex-col">
              <div className="flex items-center justify-between">
                <Link
                  to={`/company/${encodeURIComponent(company)}`}
                  className={`font-mono text-code-base ${isActive ? 'text-primary font-medium' : 'text-gray-300'} hover:text-primary transition-colors duration-150`}
                >
                  {company}
                </Link>
                <button
                  onClick={() => toggleCompany(company)}
                  className="text-gray-400 hover:text-primary p-1 transition-colors duration-150"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? '−' : '+'}
                </button>
              </div>

              {isExpanded && (
                <ul className="ml-4 mt-1 space-y-1 border-l border-gray-700 pl-2">
                  {timeBuckets.map(bucket => (
                    <li key={bucket}>
                      <button
                        onClick={() => handleBucketClick(company, bucket)}
                        className="font-mono text-code-sm text-gray-400 hover:text-primary hover:bg-gray-800 w-full text-left px-2 py-1 rounded-code transition-colors duration-150"
                      >
                        {bucket}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}