// frontend/src/components/BucketsTabs.js

import React from 'react';

export default function BucketsTabs({ buckets, selected, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
      {buckets.map(bucket => (
        <button
          key={bucket}
          onClick={() => onSelect(bucket)}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            background: bucket === selected ? '#1976d2' : '#f0f0f0',
            color:      bucket === selected ? '#fff'    : '#000',
            fontWeight: bucket === selected ? '600'      : '400',
          }}
        >
          {bucket}
        </button>
      ))}
    </div>
  );
}
