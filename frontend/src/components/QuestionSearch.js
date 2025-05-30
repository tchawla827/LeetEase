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
    onSearch(newValue); // push up for full-table filtering
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

  // 🔍 Highlight any matching substring in question title
  const renderSuggestion = (sug, { query }) => {
    const idx = sug.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <div className="p-2">{sug}</div>;

    const before = sug.slice(0, idx);
    const match = sug.slice(idx, idx + query.length);
    const after = sug.slice(idx + query.length);

    return (
      <div className="p-2 hover:bg-gray-100">
        {before}<strong>{match}</strong>{after}
      </div>
    );
  };

  const inputProps = {
    placeholder: 'Search questions…',
    value,
    onChange,
    className: 'w-full p-2 border rounded'
  };

  return (
    <div className="my-4">
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested}
        onSuggestionsClearRequested={onSuggestionsClearRequested}
        getSuggestionValue={sug => sug}
        renderSuggestion={renderSuggestion}
        onSuggestionSelected={onSuggestionSelected}
        inputProps={inputProps}
      />
    </div>
  );
}
