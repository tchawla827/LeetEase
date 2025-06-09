import React from 'react';

export default function BucketsTabs({ buckets, selected, onSelect }) {
  return (
    <div className="flex gap-code mt-4 mb-4">
      {buckets.map((bucket) => (
        <button
          key={bucket}
          onClick={() => onSelect(bucket)}
          className={`
            font-mono text-code-sm rounded-code px-4 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/50
            ${
              bucket === selected
                ? 'bg-primary text-white font-semibold ring-1 ring-primary/50'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700 transition'
            }
          `}
        >
          {bucket}
        </button>
      ))}
    </div>
  );
}