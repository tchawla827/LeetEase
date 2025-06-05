import React, { useState } from 'react'
import Autosuggest from 'react-autosuggest'
import universities from '../data/universities.json'

export default function UniversityAutocomplete({ value, onChange }) {
  const [inputValue, setInputValue] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [isOther, setIsOther] = useState(false)
  const [otherValue, setOtherValue] = useState('')

  const getSuggestions = (val) => {
    const input = val.trim().toLowerCase()
    if (!input) {
      return ['Other']
    }
    const filtered = universities.filter(u => u.toLowerCase().includes(input)).slice(0, 7)
    filtered.push('Other')
    return filtered
  }

  const onSuggestionsFetchRequested = ({ value }) => {
    setSuggestions(getSuggestions(value))
  }

  const onSuggestionsClearRequested = () => {
    setSuggestions([])
  }

  const onSuggestionSelected = (_, { suggestion }) => {
    if (suggestion === 'Other') {
      setIsOther(true)
      setInputValue('Other')
      setOtherValue('')
      onChange('')
    } else {
      setIsOther(false)
      setInputValue(suggestion)
      onChange(suggestion)
    }
  }

  const handleInputChange = (_, { newValue }) => {
    setInputValue(newValue)
    if (isOther && newValue !== 'Other') {
      setIsOther(false)
    }
    onChange(newValue)
  }

  const inputProps = {
    placeholder: 'College/University',
    value: inputValue,
    onChange: handleInputChange,
    className: 'w-full bg-gray-900 border border-gray-700 rounded-code px-3 py-2 text-code-base text-gray-100 font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50'
  }

  return (
    <div className="space-y-2">
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested}
        onSuggestionsClearRequested={onSuggestionsClearRequested}
        getSuggestionValue={(sug) => sug}
        renderSuggestion={(sug) => (
          <div className="p-2 text-code-sm text-gray-100 hover:bg-gray-800 cursor-pointer transition-colors duration-150">{sug}</div>
        )}
        onSuggestionSelected={onSuggestionSelected}
        inputProps={inputProps}
        theme={{
          container: 'relative',
          suggestionsContainer: 'absolute w-full bg-gray-900 border border-gray-700 mt-1 rounded-code shadow-lg z-10',
          suggestionsList: 'list-none p-0 m-0'
        }}
      />
      {isOther && (
        <input
          type="text"
          value={otherValue}
          onChange={(e) => { setOtherValue(e.target.value); onChange(e.target.value) }}
          placeholder="Enter college"
          className="w-full bg-gray-900 border border-gray-700 rounded-code px-3 py-2 text-code-base text-gray-100 font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      )}
    </div>
  )
}
