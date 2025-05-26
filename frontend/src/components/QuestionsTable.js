// frontend/src/components/QuestionsTable.js
import React, { useEffect, useState } from 'react';
import api from '../api';

const PAGE_SIZE = 50;

const SORT_FIELDS = {
  title:          'Title',
  frequency:      'Frequency',
  acceptanceRate: 'Acceptance',
  leetDifficulty: 'Leet Diff',
  userDifficulty: 'Your Diff',
};

// Numeric rank so asc⇄desc sorts “Easy → Medium → Hard”
const difficultyRank = { Easy: 1, Medium: 2, Hard: 3 };

export default function QuestionsTable({
  company,
  bucket,
  showUnsolved,
  searchTerm,
}) {
  const [questions, setQuestions]   = useState([]);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(false);

  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  /* ──────────────────────────────────────────────────────────────── */
  /*  Reset to page 1 whenever filters / sort / search change        */
  /* ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    setPage(1);
  }, [company, bucket, showUnsolved, sortField, sortOrder, searchTerm]);

  /* ──────────────────────────────────────────────────────────────── */
  /*  Fetch questions                                                */
  /* ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!company || !bucket) {
      setQuestions([]);
      setTotalPages(1);
      return;
    }
    setLoading(true);

    const isDifficulty =
      sortField === 'leetDifficulty' || sortField === 'userDifficulty';

    const params = {
      page,
      limit: PAGE_SIZE,
      showUnsolved,
      ...(searchTerm && { search: searchTerm }),
      ...(!isDifficulty && sortField && { sortField, sortOrder }),
    };

    api
      .get(
        `/api/companies/${encodeURIComponent(company)}/buckets/${encodeURIComponent(bucket)}/questions`,
        { params }
      )
      .then(res => {
        const { data, total } = res.data;
        setTotalPages(Math.ceil(total / PAGE_SIZE));

        let list = data;
        if (showUnsolved) list = list.filter(q => !q.solved);

        if (isDifficulty) {
          list = [...list].sort((a, b) => {
            const ra = difficultyRank[a[sortField]] ?? 0;
            const rb = difficultyRank[b[sortField]] ?? 0;
            return sortOrder === 'asc' ? ra - rb : rb - ra;
          });
        }

        setQuestions(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [
    company,
    bucket,
    page,
    showUnsolved,
    sortField,
    sortOrder,
    searchTerm,
  ]);

  /* ──────────────────────────────────────────────────────────────── */
  /*  Helpers                                                        */
  /* ──────────────────────────────────────────────────────────────── */
  const onSort = field => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const arrow = f =>
    sortField === f ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : '';

  /** Upsert solved / difficulty for *all* duplicates the backend returns */
  const updateField = (questionId, field, value) => {
    api
      .patch(`/api/questions/${questionId}`, { [field]: value })
      .then(res => {
        const updates = Array.isArray(res.data) ? res.data : [res.data];
        setQuestions(prev =>
          prev.map(q => {
            const hit = updates.find(u => u.question_id === q.id);
            return hit
              ? {
                  ...q,
                  solved: hit.solved,
                  userDifficulty: hit.userDifficulty ?? null,
                }
              : q;
          })
        );
      })
      .catch(console.error);
  };

  /* ──────────────────────────────────────────────────────────────── */
  /*  Render                                                         */
  /* ──────────────────────────────────────────────────────────────── */
  return (
    <>
      <table style={{ width: '100%', borderCollapse: 'collapse' }} border="1" cellPadding="8">
        <thead>
          <tr>
            {Object.entries(SORT_FIELDS).map(([field, label]) => (
              <th
                key={field}
                onClick={() => onSort(field)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                {label}
                {arrow(field)}
              </th>
            ))}
            <th>Link</th>
            <th>Solved</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center' }}>Loading…</td>
            </tr>
          ) : questions.length ? (
            questions.map(q => (
              <tr key={q.id}>
                <td>{q.title}</td>
                <td>{q.frequency}</td>
                <td>{(q.acceptanceRate * 100).toFixed(1)}%</td>
                <td>{q.leetDifficulty}</td>
                <td>
                  <select
                    value={q.userDifficulty || ''}
                    onChange={e => updateField(q.id, 'userDifficulty', e.target.value)}
                  >
                    <option value="">–</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </td>
                <td>
                  <a href={q.link} target="_blank" rel="noopener noreferrer">View</a>
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={q.solved}
                    onChange={e => updateField(q.id, 'solved', e.target.checked)}
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center' }}>No questions found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
        <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>
          ← Prev
        </button>
        <span style={{ margin: '0 1rem' }}>
          Page {page} of {totalPages}
        </span>
        <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
          Next →
        </button>
      </div>
    </>
  );
}
