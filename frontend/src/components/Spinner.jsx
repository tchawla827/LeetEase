import React from 'react';

export default function Spinner({ size = 16, className = '' }) {
  return (
    <div
      className={`border-2 border-gray-600 border-t-primary rounded-full animate-spin ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
