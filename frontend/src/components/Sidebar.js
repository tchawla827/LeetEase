// frontend/src/components/Sidebar.js

import React, { useState, useEffect } from 'react';
import Autosuggest from 'react-autosuggest';
import debounce from 'lodash.debounce';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const [value, setValue]      = useState('');
  const [suggestions, setSug]  = useState([]);
  const [allCompanies, setAll] = useState([]);
  const [focused, setFocused]  = useState(false);
  const location               = useLocation();
  const navigate               = useNavigate();
  const activeCompany          = decodeURIComponent(
    location.pathname.split('/company/')[1] || ''
  );

  // Load full company list
  useEffect(() => {
    axios
      .get('/api/companies')
      .then(res => setAll(res.data))
      .catch(console.error);
  }, []);

  // Debounced substring search
  const fetchSuggestions = debounce(q => {
    if (!q) return setSug([]);
    axios
      .get('/api/companies', { params: { search: q } })
      .then(res => setSug(res.data))
      .catch(console.error);
  }, 300);

  const onChange = (_, { newValue }) => {
    setValue(newValue);
    fetchSuggestions(newValue);
  };

  const onSuggestionsFetchRequested = ({ value }) => {
    fetchSuggestions(value);
  };

  const onSuggestionsClearRequested = () => {
    setSug([]);
  };

  const onSuggestionSelected = (_, { suggestion }) => {
    setValue('');
    setSug([]);
    navigate(`/company/${encodeURIComponent(suggestion)}`);
  };

  // 🔥 Highlight any matching substring
  const renderSuggestion = (sug, { query }) => {
    const idx = sug.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <div style={{ padding: '0.5rem' }}>{sug}</div>;

    const before = sug.slice(0, idx);
    const match  = sug.slice(idx, idx + query.length);
    const after  = sug.slice(idx + query.length);

    return (
      <div style={{ padding: '0.5rem' }}>
        {before}<strong>{match}</strong>{after}
      </div>
    );
  };

  const inputProps = {
    placeholder: 'Search companies…',
    value,
    onChange,
    onFocus: () => setFocused(true),
    onBlur: () => {
      setFocused(false);
      setSug([]);
    },
    className: 'w-full p-2 border rounded mb-4'
  };

  return (
    <aside style={{
      width: 220,
      borderRight: '1px solid #ddd',
      padding: '1rem',
      boxSizing: 'border-box',
      height: '100vh',
      overflowY: 'auto',
      background: '#fafafa'
    }}>
      <h2 style={{ marginTop: 0 }}>Companies</h2>

      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested}
        onSuggestionsClearRequested={onSuggestionsClearRequested}
        getSuggestionValue={sug => sug}
        renderSuggestion={renderSuggestion}
        onSuggestionSelected={onSuggestionSelected}
        inputProps={inputProps}
      />

      {/* fallback full list */}
      {(!value || !focused) && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {allCompanies.map(company => {
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
                  • {company}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
