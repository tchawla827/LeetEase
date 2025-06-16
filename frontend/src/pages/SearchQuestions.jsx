import React, { useState } from 'react';
import Autosuggest from 'react-autosuggest';
import debounce from 'lodash.debounce';
import { suggestQuestions, getQuestionCompanies } from '../api';

export default function SearchQuestions() {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [companies, setCompanies] = useState([]);

  const fetchSuggestions = debounce(async (q) => {
    if (!q) { setSuggestions([]); return; }
    try {
      const { data } = await suggestQuestions(q, 10);
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error('Failed to fetch suggestions', err);
    }
  }, 300);

  const onChange = (_, { newValue }) => {
    setValue(newValue);
  };

  const onSuggestionsFetchRequested = ({ value }) => fetchSuggestions(value);
  const onSuggestionsClearRequested = () => setSuggestions([]);

  const onSuggestionSelected = (_, { suggestion }) => {
    setValue(suggestion.title);
    setSuggestions([]);
    getQuestionCompanies(suggestion.id)
      .then(res => setCompanies(res.data.companies))
      .catch(err => {
        console.error('Failed to fetch companies', err);
        setCompanies([]);
      });
  };

  const renderSuggestion = (sug, { query }) => {
    const text = sug.title;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return (
      <div className="p-2 text-code-sm text-gray-100">{text}</div>
    );
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length);
    return (
      <div className="p-2 text-code-sm text-gray-100 hover:bg-gray-800 cursor-pointer transition-colors duration-150">
        {before}<strong className="text-yellow-400 font-medium">{match}</strong>{after}
      </div>
    );
  };

  const inputProps = {
    placeholder: 'Search questions...',
    value,
    onChange,
    className: 'w-full px-3 py-2 text-code-sm bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-code focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50'
  };

  return (
    <div className="max-w-xl mx-auto mt-8">
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested}
        onSuggestionsClearRequested={onSuggestionsClearRequested}
        getSuggestionValue={s => s.title}
        renderSuggestion={renderSuggestion}
        onSuggestionSelected={onSuggestionSelected}
        inputProps={inputProps}
        theme={{
          container: 'relative',
          suggestionsContainer: 'absolute w-full bg-gray-800 border border-gray-600 mt-1 rounded-code shadow-lg z-10',
          suggestionsList: 'list-none p-0 m-0',
        }}
      />
      {companies.length > 0 && (
        <div className="mt-6 bg-surface rounded-card p-card border border-gray-300 dark:border-gray-800">
          <h2 className="font-mono text-code-base font-semibold mb-2">Asked by</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-900 dark:text-gray-100">
            {companies.map(name => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
