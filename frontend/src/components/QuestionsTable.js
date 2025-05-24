// frontend/src/components/QuestionsTable.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PAGE_SIZE = 50;

// Map our sort keys to user-friendly labels
const SORT_FIELDS = {
  title:          "Title",
  frequency:      "Frequency",
  acceptanceRate: "Acceptance",
  leetDifficulty: "Leet Diff"
};

export default function QuestionsTable({ company, bucket, showUnsolved }) {
  const [questions, setQuestions]   = useState([]);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(false);

  // Sorting state
  const [sortField, setSortField]   = useState(null);
  const [sortOrder, setSortOrder]   = useState("asc");

  // Reset to page 1 whenever any filter or sort changes
  useEffect(() => {
    setPage(1);
  }, [company, bucket, showUnsolved, sortField, sortOrder]);

  // Fetch data
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
        {
          params: {
            page,
            limit: PAGE_SIZE,
            sortField,
            sortOrder
          }
        }
      )
      .then(res => {
        const { data, total } = res.data;
        setTotalPages(Math.ceil(total / PAGE_SIZE));

        const filtered = showUnsolved
          ? data.filter(q => !q.solved)
          : data;

        setQuestions(filtered);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [company, bucket, page, showUnsolved, sortField, sortOrder]);

  // Toggle sort on header click
  const onSort = field => {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Patch updates back to server
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

  // Helper to render sort arrow
  const arrow = field =>
    sortField === field ? (sortOrder === "asc" ? " ▲" : " ▼") : "";

  return (
    <>
      <table
        style={{ width: '100%', borderCollapse: 'collapse' }}
        border="1"
        cellPadding="8"
      >
        <thead>
          <tr>
            {/* Sortable Title */}
            <th
              onClick={() => onSort("title")}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              {SORT_FIELDS.title}{arrow("title")}
            </th>

            {/* Link (not sortable) */}
            <th>Link</th>

            {/* Sortable Frequency */}
            <th
              onClick={() => onSort("frequency")}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              {SORT_FIELDS.frequency}{arrow("frequency")}
            </th>

            {/* Sortable Acceptance */}
            <th
              onClick={() => onSort("acceptanceRate")}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              {SORT_FIELDS.acceptanceRate}{arrow("acceptanceRate")}
            </th>

            {/* Sortable Leet Diff */}
            <th
              onClick={() => onSort("leetDifficulty")}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              {SORT_FIELDS.leetDifficulty}{arrow("leetDifficulty")}
            </th>

            {/* Your own difficulty and solved columns */}
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
                {/* Title */}
                <td>{q.title}</td>

                {/* Link */}
                <td>
                  <a href={q.link} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                </td>

                {/* Frequency */}
                <td>{q.frequency}</td>

                {/* Acceptance */}
                <td>{(q.acceptanceRate * 100).toFixed(1)}%</td>

                {/* Leet Difficulty */}
                <td>{q.leetDifficulty}</td>

                {/* Your Difficulty */}
                <td>
                  <select
                    value={q.userDifficulty || ''}
                    onChange={e =>
                      updateField(q.id, 'userDifficulty', e.target.value)
                    }
                  >
                    <option value="">–</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </td>

                {/* Solved checkbox */}
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
        <button
          onClick={() => setPage(p => Math.max(p - 1, 1))}
          disabled={page === 1}
        >
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
