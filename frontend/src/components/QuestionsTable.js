// frontend/src/components/QuestionsTable.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const difficulties = ['Easy', 'Medium', 'Hard'];
const PAGE_SIZE   = 50;

export default function QuestionsTable({ company, bucket, showUnsolved }) {
  const [questions, setQuestions]   = useState([]);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(false);

  // Whenever company, bucket, or filter changes, reset to page 1
  useEffect(() => {
    setPage(1);
  }, [company, bucket, showUnsolved]);

  // Fetch the current page (and total count) on dependency change
  useEffect(() => {
    if (!company || !bucket) {
      setQuestions([]);
      setTotalPages(1);
      return;
    }

    setLoading(true);
    axios
      .get(
        `/api/companies/${encodeURIComponent(company)}/buckets/${bucket}/questions`,
        { params: { page, limit: PAGE_SIZE } }
      )
      .then(res => {
        const { data, total } = res.data;
        // Compute how many pages in total
        setTotalPages(Math.ceil(total / PAGE_SIZE));

        // Apply “Unsolved only” filter client‐side
        const filtered = showUnsolved
          ? data.filter(q => !q.solved)
          : data;

        setQuestions(filtered);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [company, bucket, page, showUnsolved]);

  // Send updates back to server (solved flag or userDifficulty)
  const updateField = (id, field, value) => {
    axios
      .patch(`/api/questions/${id}`, { [field]: value })
      .then(res => {
        const updated = res.data;
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
      <table
        style={{ width: '100%', borderCollapse: 'collapse' }}
        border="1"
        cellPadding="8"
      >
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
          {loading ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center' }}>
                Loading…
              </td>
            </tr>
          ) : questions.length ? (
            questions.map(q => (
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
                    onChange={e =>
                      updateField(q.id, 'userDifficulty', e.target.value)
                    }
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
                    onChange={e =>
                      updateField(q.id, 'solved', e.target.checked)
                    }
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center' }}>
                No questions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '1rem 0'
        }}
      >
        <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>
          ← Prev
        </button>

        <span style={{ margin: '0 1rem' }}>
          Page {page} of {totalPages}
        </span>

        <button
          onClick={() => setPage(p => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
        >
          Next →
        </button>
      </div>
    </>
  );
}
