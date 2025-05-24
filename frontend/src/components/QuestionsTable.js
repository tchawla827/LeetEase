// frontend/src/components/QuestionsTable.js

import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';

const difficulties = ['Easy', 'Medium', 'Hard'];
const PAGE_SIZE = 50;

export default function QuestionsTable({ company, bucket, showUnsolved }) {
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);

  // 1) Fetch a page of questions
  const fetchQuestions = useCallback(
    (pageNum) => {
      axios
        .get(
          `/api/companies/${encodeURIComponent(company)}/buckets/${bucket}/questions`,
          { params: { page: pageNum, limit: PAGE_SIZE } }
        )
        .then((res) => {
          const data = res.data;
          setQuestions((prev) => [...prev, ...data]);
          if (data.length < PAGE_SIZE) setHasMore(false);
        })
        .catch(console.error);
    },
    [company, bucket]
  );

  // 2) Reset & load first page when company or bucket changes
  useEffect(() => {
    setQuestions([]);
    setPage(1);
    setHasMore(true);
    fetchQuestions(1);
  }, [fetchQuestions]);

  // 3) Infinite-scroll: observe loader div
  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: '200px' }
    );
    const current = loaderRef.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasMore]);

  // 4) Fetch subsequent pages
  useEffect(() => {
    if (page === 1) return;
    fetchQuestions(page);
  }, [page, fetchQuestions]);

  // 5) Update a question field and merge updates
  const updateField = (id, field, value) => {
    axios
      .patch(`/api/questions/${id}`, { [field]: value })
      .then((res) => {
        const updated = res.data; // array of docs sharing same link
        setQuestions((prev) =>
          prev.map((q) => {
            const match = updated.find((u) => u.id === q.id);
            return match || q;
          })
        );
      })
      .catch(console.error);
  };

  // 6) Apply “Unsolved only” filter
  const displayed = showUnsolved
    ? questions.filter((q) => !q.solved)
    : questions;

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
          {displayed.map((q) => (
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
                  onChange={(e) =>
                    updateField(q.id, 'userDifficulty', e.target.value)
                  }
                >
                  <option value="">–</option>
                  {difficulties.map((d) => (
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
                  onChange={(e) =>
                    updateField(q.id, 'solved', e.target.checked)
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Sentinel div for infinite scroll */}
      {hasMore && <div ref={loaderRef} style={{ height: 1, margin: '1rem 0' }} />}

      {/* End-of-list marker */}
      {!hasMore && (
        <p style={{ textAlign: 'center', margin: '1rem 0' }}>— End of list —</p>
      )}
    </>
  );
}
