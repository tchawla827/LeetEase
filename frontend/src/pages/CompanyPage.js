// frontend/src/pages/CompanyPage.js

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BucketsTabs from '../components/BucketsTabs';
import QuestionsTable from '../components/QuestionsTable';

const BUCKET_ORDER = [
  '30Days',
  '3Months',
  '6Months',
  'All',
  'MoreThan6Months'
];

export default function CompanyPage() {
  const { companyName } = useParams();
  const [buckets, setBuckets]               = useState([]);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [showUnsolved, setShowUnsolved]     = useState(false);
  const [searchTerm, setSearchTerm]         = useState('');

  // fetch and order buckets
  useEffect(() => {
    setSelectedBucket(null);
    fetch(`/api/companies/${encodeURIComponent(companyName)}/buckets`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load buckets');
        return res.json();
      })
      .then(raw => {
        const filtered = raw
          .filter(b => BUCKET_ORDER.includes(b))
          .sort((a, b) => BUCKET_ORDER.indexOf(a) - BUCKET_ORDER.indexOf(b));
        setBuckets(filtered);
      })
      .catch(console.error);
  }, [companyName]);

  return (
    <div style={{ padding: '1rem', height: '100%', overflow: 'auto' }}>
      <h1>{companyName}</h1>

      <div style={{ margin: '0.5rem 0' }}>
        <label>
          <input
            type="checkbox"
            checked={showUnsolved}
            onChange={e => setShowUnsolved(e.target.checked)}
          />{' '}
          Unsolved only
        </label>
      </div>

      <BucketsTabs
        buckets={buckets}
        selected={selectedBucket}
        onSelect={setSelectedBucket}
      />

      {selectedBucket && (
        <>
          {/* simple substring‐only search input */}
          <div style={{ margin: '1rem 0' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search questions…"
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <QuestionsTable
            company={companyName}
            bucket={selectedBucket}
            showUnsolved={showUnsolved}
            searchTerm={searchTerm}
          />
        </>
      )}

      {!selectedBucket && buckets.length === 0 && (
        <p>No buckets found for this company.</p>
      )}
    </div>
  );
}
