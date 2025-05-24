// frontend/src/components/QuestionsTable.js

import React, { useEffect, useState } from 'react';
import axios                             from 'axios';

const difficulties = ['Easy', 'Medium', 'Hard'];
const PAGE_SIZE   = 50;

export default function QuestionsTable({ company, bucket, showUnsolved }) {
  const [questions, setQuestions] = useState([]);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(false);

  // Reset to page 1 whenever bucket or filter changes
  useEffect(() => {
    setPage(1);
  }, [company, bucket, showUnsolved]);

  // Fetch one page at a time (and filter if needed)
  useEffect(() => {
    if (!company || !bucket) {
      setQuestions([]);
      setHasMore(false);
      return;
    }

    axios
      .get(
        `/api/companies/${encodeURIComponent(company)}/buckets/${bucket}/questions`,
        { params: { page, limit: PAGE_SIZE } }
      )
      .then(res => {
        const data = res.data;
        // if we got a full page back, assume there’s more
        setHasMore(data.length === PAGE_SIZE);

        // apply “Unsolved only” filter client-side
        const filtered = showUnsolved
          ? data.filter(q => !q.solved)
          : data;

        setQuestions(filtered);
      })
      .catch(console.error);
  }, [company, bucket, page, showUnsolved]);

  // Patch updates (difficulty / solved status)
  const updateField = (id, field, value) => {
    axios
      .patch(`/api/questions/${id}`, { [field]: value })
      .then(res => {
        const updated = res.data; // array of docs sharing this link
        setQuestions(prev =>
          prev.map(q => {
            const match = updated.find(u => u.id === q.id);
            return match || q;
          })
        );
      })
      .catch(console.error);
  };

  return (
    <>
      <table style={{ width: '100%', borderCollapse: 'collapse' }} border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Title</th>
            <th>Link</th>
            <th>Frequency</th>
            <th>Acceptance</th>
            <th>Leet Diff</th>
            <th>Your Diff</th>
            <th>Solved</th>
          </tr>
        </thead>
        <tbody>
          {questions.map(q => (
            <tr key={q.id}>
              <td>{q.title}</td>
              <td>
                <a href={q.link} target="_blank" rel="noopener noreferrer">
                  View
                </a>
              </td>
              <td>{q.frequency}</td>
              <td>{(q.acceptanceRate * 100).toFixed(1)}%</td>
              <td>{q.leetDifficulty}</td>
              <td>
                <select
                  value={q.userDifficulty || ''}
                  onChange={e => updateField(q.id, 'userDifficulty', e.target.value)}
                >
                  <option value="">–</option>
                  {difficulties.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={q.solved}
                  onChange={e => updateField(q.id, 'solved', e.target.checked)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Simple pagination controls */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
        <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>
          ← Prev
        </button>
        <span style={{ margin: '0 1rem' }}>Page {page}</span>
        <button onClick={() => hasMore && setPage(p => p + 1)} disabled={!hasMore}>
          Next →
        </button>
      </div>
    </>
  );
}
