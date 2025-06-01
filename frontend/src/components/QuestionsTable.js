import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 50;

const SORT_FIELDS = {
  title: 'Title',
  frequency: 'Frequency',
  acceptanceRate: 'Acceptance',
  leetDifficulty: 'Difficulty',
  userDifficulty: 'Your Rating',
};

const difficultyRank = { Easy: 1, Medium: 2, Hard: 3 };

export default function QuestionsTable({
  company,
  bucket,
  showUnsolved,
  searchTerm,
  tagFilter,
  refreshKey
}) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [batchDifficulty, setBatchDifficulty] = useState('');

  // Clear selection when questions change
  useEffect(() => {
    setSelected([]);
    setBatchDifficulty('');
  }, [questions]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [company, bucket, showUnsolved, sortField, sortOrder, searchTerm, tagFilter, refreshKey]);

  // Fetch questions
  useEffect(() => {
    if (!company || !bucket) {
      setQuestions([]);
      setTotalPages(1);
      return;
    }
    setLoading(true);

    const isDifficulty = sortField === 'leetDifficulty' || sortField === 'userDifficulty';

    const params = {
      page,
      limit: PAGE_SIZE,
      showUnsolved,
      ...(searchTerm && { search: searchTerm }),
      ...(!isDifficulty && sortField && { sortField, sortOrder }),
      ...(tagFilter && { tag: tagFilter }),
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
        if (showUnsolved) {
          list = list.filter(q => !q.solved);
        }
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
  }, [company, bucket, page, showUnsolved, sortField, sortOrder, searchTerm, tagFilter, refreshKey]);

  // Sort handlers
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

  // Update single question
  const updateField = (questionId, field, value) => {
    api
      .patch(`/api/questions/${questionId}`, { [field]: value })
      .then(res => {
        const updates = Array.isArray(res.data) ? res.data : [res.data];
        setQuestions(prev =>
          prev.map(q => {
            const hit = updates.find(u => u.question_id === q.id);
            if (!hit) return q;
            return {
              ...q,
              solved: hit.solved,
              userDifficulty: hit.userDifficulty ?? null,
            };
          })
        );
      })
      .catch(console.error);
  };

  // Batch update
  const batchUpdate = fields => {
    if (!selected.length) return;
    api
      .patch('/api/questions/batch-meta', {
        ids: selected,
        ...fields
      })
      .then(res => {
        const updates = res.data;
        setQuestions(prev =>
          prev.map(q => {
            const hit = updates.find(u => u.question_id === q.id);
            if (!hit) return q;
            return {
              ...q,
              solved: hit.solved,
              userDifficulty: hit.userDifficulty ?? null,
            };
          })
        );
        setSelected([]);
        setBatchDifficulty('');
      })
      .catch(console.error);
  };

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-code-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900 text-gray-400">
              <th className="px-card py-2 text-left">
                <input
                  type="checkbox"
                  checked={questions.length > 0 && selected.length === questions.length}
                  onChange={() =>
                    selected.length === questions.length
                      ? setSelected([])
                      : setSelected(questions.map(q => q.id))
                  }
                  className="rounded-code border-gray-700 bg-gray-800 text-primary focus:ring-primary/50"
                />
              </th>
              {Object.entries(SORT_FIELDS).map(([field, label]) => (
                <th
                  key={field}
                  onClick={() => onSort(field)}
                  className="px-card py-2 text-left cursor-pointer select-none hover:text-gray-300"
                >
                  {label}
                  <span className="text-gray-500">{arrow(field)}</span>
                </th>
              ))}
              <th className="px-card py-2 text-left">Link</th>
              <th className="px-card py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={Object.keys(SORT_FIELDS).length + 3} className="px-card py-4 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : questions.length ? (
              questions.map(q => (
                <tr
                  key={q.id}
                  className={`border-gray-800 hover:bg-gray-900/50 transition-colors duration-150 ${
                    q.solved ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  <td className="px-card py-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(q.id)}
                      onChange={() =>
                        setSelected(sel =>
                          sel.includes(q.id)
                            ? sel.filter(x => x !== q.id)
                            : [...sel, q.id]
                        )
                      }
                      className="rounded-code border-gray-700 bg-gray-800 text-primary focus:ring-primary/50"
                    />
                  </td>
                  <td className="px-card py-2">{q.title}</td>
                  <td className="px-card py-2">{q.frequency}</td>
                  <td className="px-card py-2">{(q.acceptanceRate * 100).toFixed(1)}%</td>
                  <td className="px-card py-2">
                    <span className={
                      q.leetDifficulty === 'Easy' ? 'text-green-400' :
                      q.leetDifficulty === 'Medium' ? 'text-yellow-400' :
                      q.leetDifficulty === 'Hard' ? 'text-red-400' : 'text-gray-400'
                    }>
                      {q.leetDifficulty}
                    </span>
                  </td>
                  <td className="px-card py-2">
                    <select
                      value={q.userDifficulty || ''}
                      onChange={e => updateField(q.id, 'userDifficulty', e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-code px-1 py-0.5 text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <option value="">–</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </td>
                  <td className="px-card py-2">
                    <a
                      href={q.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View
                    </a>
                  </td>
                  <td className="px-card py-2">
                    <input
                      type="checkbox"
                      checked={q.solved}
                      onChange={e => updateField(q.id, 'solved', e.target.checked)}
                      className="rounded-code border-gray-700 bg-gray-800 text-primary focus:ring-primary/50"
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={Object.keys(SORT_FIELDS).length + 3} className="px-card py-4 text-center text-gray-400">
                  No questions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected.length > 0 && (
        <div className="sticky bottom-0 bg-surface border-t border-gray-800 px-card py-2 flex items-center gap-code z-10">
          <strong className="text-gray-300">{selected.length} selected</strong>
          <button
            onClick={() => batchUpdate({ solved: true })}
            className="font-mono text-code-sm bg-transparent hover:bg-gray-800 text-gray-400 hover:text-gray-100 px-2 py-1 rounded-code border border-gray-700 transition-colors duration-150"
          >
            Mark Solved
          </button>
          <button
            onClick={() => batchUpdate({ solved: false })}
            className="font-mono text-code-sm bg-transparent hover:bg-gray-800 text-gray-400 hover:text-gray-100 px-2 py-1 rounded-code border border-gray-700 transition-colors duration-150"
          >
            Mark Unsolved
          </button>
          <select
            value={batchDifficulty}
            onChange={e => setBatchDifficulty(e.target.value)}
            className="font-mono text-code-sm bg-gray-800 border border-gray-700 rounded-code px-2 py-1 text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="">Set difficulty…</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <button
            disabled={!batchDifficulty}
            onClick={() => batchUpdate({ userDifficulty: batchDifficulty })}
            className="font-mono text-code-sm bg-primary hover:bg-[#2a7aeb] text-white px-2 py-1 rounded-code transition-colors duration-150 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}

      <div className="flex justify-center items-center gap-code my-2">
        <button
          onClick={() => setPage(p => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="font-mono text-code-sm bg-transparent hover:bg-gray-800 text-gray-400 hover:text-gray-100 px-3 py-1 rounded-code border border-gray-700 transition-colors duration-150 disabled:opacity-50"
        >
          ← Prev
        </button>
        <span className="text-gray-300">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="font-mono text-code-sm bg-transparent hover:bg-gray-800 text-gray-400 hover:text-gray-100 px-3 py-1 rounded-code border border-gray-700 transition-colors duration-150 disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}