// frontend/src/components/BucketsTabs.js
import React from 'react';

export default function BucketsTabs({ buckets, selectedBucket, onSelect }) {
  return (
    <div style={{ margin: '1rem 0' }}>
      {buckets.map(bucket => (
        <button
          key={bucket}
          onClick={() => onSelect(bucket)}
          style={{
            marginRight: '0.5rem',
            padding: '0.5rem 1rem',
            background: bucket === selectedBucket ? '#007bff' : '#eee',
            color: bucket === selectedBucket ? '#fff' : '#000',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          {bucket}
        </button>
      ))}
    </div>
  );
}
