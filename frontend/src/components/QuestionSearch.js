// frontend/src/components/QuestionSearch.js

import React, { useState } from 'react';
import Autosuggest from 'react-autosuggest';
import debounce from 'lodash.debounce';
import axios from 'axios';

export default function QuestionSearch({ company, bucket, onSearch }) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Debounced call to suggestions endpoint
  const fetchSuggestions = debounce(async (q) => {
    if (!q) {
      setSuggestions([]);
      return;
    }
    try {
      const { data } = await axios.get(
        `/api/companies/${encodeURIComponent(company)}/questions/suggestions`,
        { params: { bucket, query: q, limit: 10 } }
      );
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error('Error fetching question suggestions', err);
    }
  }, 300);

  const onChange = (_, { newValue }) => {
    setValue(newValue);
    onSearch(newValue);
  };

  const onSuggestionsFetchRequested = ({ value }) => {
    fetchSuggestions(value);
  };

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const onSuggestionSelected = (_, { suggestion }) => {
    setValue(suggestion);
    onSearch(suggestion);
    setSuggestions([]);
  };

  // Highlight any matching substring in question title
  const renderSuggestion = (sug, { query }) => {
    const idx = sug.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <div className="p-2 text-code-sm text-gray-100">{sug}</div>;

    const before = sug.slice(0, idx);
    const match = sug.slice(idx, idx + query.length);
    const after = sug.slice(idx + query.length);

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
    className: 'w-full px-3 py-2 pr-8 text-code-sm bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-code focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50'
  };

  const clearSearch = () => {
    setValue('');
    onSearch('');
    setSuggestions([]);
  };

  const renderInput = inputProps => (
    <div className="relative">
      <input {...inputProps} />
      {value && (
        <button
          onClick={e => { e.preventDefault(); clearSearch(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );

  return (
    <div className="relative my-4">
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested}
        onSuggestionsClearRequested={onSuggestionsClearRequested}
        getSuggestionValue={sug => sug}
        renderSuggestion={renderSuggestion}
        onSuggestionSelected={onSuggestionSelected}
        inputProps={inputProps}
        renderInputComponent={renderInput}
        theme={{
          container: 'relative',
          suggestionsContainer: 'absolute w-full bg-gray-800 border border-gray-600 mt-1 rounded-code shadow-lg z-10',
          suggestionsList: 'list-none p-0 m-0',
        }}
      />
    </div>
  );
}