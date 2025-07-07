// src/components/QuestionsTable.js
import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

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
  refreshKey,
}) {
  const { user } = useAuth();

  // ─── 1) Pull colorMode + palette out of user.settings ───────────────
  // colorMode is either 'leet' or 'user'
  const colorMode = user?.settings?.colorMode || 'leet';
  const palette = user?.settings?.palette || {
    easy:   '#8BC34A',
    medium: '#FFB74D',
    hard:   '#E57373',
    solved: '#9E9E9E',
  };
  const easyColor   = palette.easy;
  const mediumColor = palette.medium;
  const hardColor   = palette.hard;
  const solvedColor = palette.solved;

  // ─── Component state ───────────────────────────────────────────────────
  const [questions, setQuestions]               = useState([]);
  const [page, setPage]                         = useState(1);
  const [totalPages, setTotalPages]             = useState(1);
  const [loading, setLoading]                   = useState(false);
  const [sortField, setSortField]               = useState(null);
  const [sortOrder, setSortOrder]               = useState('asc');
  const [selected, setSelected]                 = useState([]);
  const [batchDifficulty, setBatchDifficulty]   = useState('');
  const [noteEditor, setNoteEditor]             = useState(null); // {id, text}

  // ─── Whenever the list of questions changes, clear any batch selection ─
  useEffect(() => {
    setSelected([]);
    setBatchDifficulty('');
  }, [questions]);

  // ─── Reset to page 1 whenever filters/sort/search change ─────────────────
  useEffect(() => {
    setPage(1);
  }, [company, bucket, showUnsolved, sortField, sortOrder, searchTerm, tagFilter, refreshKey]);

  // ─── Fetch questions from the backend ───────────────────────────────────
  useEffect(() => {
    if (!company || !bucket) {
      setQuestions([]);
      setTotalPages(1);
      return;
    }
    setLoading(true);

    const isDifficultySort =
      sortField === 'leetDifficulty' || sortField === 'userDifficulty';

    const params = {
      page,
      limit: PAGE_SIZE,
      showUnsolved,
      ...(searchTerm && { search: searchTerm }),
      ...(!isDifficultySort && sortField && { sortField, sortOrder }),
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
        if (isDifficultySort) {
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
    tagFilter,
    refreshKey,
  ]);

  // ─── Sorting helper ─────────────────────────────────────────────────────
  const onSort = field => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  const arrow = f => (sortField === f ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : '');

  // ─── Update a single question’s field (userDifficulty or solved) ────────
  const updateField = (questionId, field, value) => {
    api
      .patch(`/api/questions/${questionId}`, {
        [field]: value,
        company,
        bucket,
      })
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
              note: hit.note,
            };
          })
        );
      })
      .catch(console.error);
  };

  // ─── Batch‐update (solved/un‐solved or set userDifficulty for multiple) ─
  const batchUpdate = fields => {
    if (!selected.length) return;
    api
      .patch('/api/questions/batch-meta', {
        ids: selected,
        company,
        bucket,
        ...fields,
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
              note: hit.note,
            };
          })
        );
        setSelected([]);
        setBatchDifficulty('');
      })
      .catch(console.error);
  };

  // ─── 2) Helper Functions for Coloring ───────────────────────────────────

  // a) Title color: based on mode (user vs. leet)
  const getTitleColor = q => {
    if (colorMode === 'user') {
      if (q.userDifficulty) {
        switch (q.userDifficulty) {
          case 'Easy':   return easyColor;
          case 'Medium': return mediumColor;
          case 'Hard':   return hardColor;
          default:       return undefined;
        }
      }
      return q.solved ? solvedColor : undefined;
    } else {
      if (q.leetDifficulty) {
        switch (q.leetDifficulty) {
          case 'Easy':   return easyColor;
          case 'Medium': return mediumColor;
          case 'Hard':   return hardColor;
          default:       return undefined;
        }
      }
      return undefined;
    }
  };

  // b) Difficulty column color (always Leet‐based)
  const getDifficultyColor = q => {
    if (q.leetDifficulty) {
      switch (q.leetDifficulty) {
        case 'Easy':   return easyColor;
        case 'Medium': return mediumColor;
        case 'Hard':   return hardColor;
        default:       return undefined;
      }
    }
    return undefined;
  };

  // c) “Your Rating” text color for closed <select>
  const getYourRatingColor = q => {
    if (q.userDifficulty) {
      switch (q.userDifficulty) {
        case 'Easy':   return easyColor;
        case 'Medium': return mediumColor;
        case 'Hard':   return hardColor;
        default:       return undefined;
      }
    }
    if (colorMode === 'user' && q.solved) {
      return solvedColor;
    }
    return undefined;
  };

  // d) Option‐item color (dropdown options)
  const getOptionColor = difficultyValue => {
    if (!difficultyValue) return undefined;
    switch (difficultyValue) {
      case 'Easy':   return easyColor;
      case 'Medium': return mediumColor;
      case 'Hard':   return hardColor;
      default:       return undefined;
    }
  };

  // ─── 3) Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      {/* <div className="overflow-x-auto rounded-xl border border-gray-800"> */}
      <div className="overflow-x-auto rounded-xl border border-gray-300 dark:border-gray-800 bg-surface/0">
        {/* Slight border + rounded corners around the table */}
        <table className="w-full border-collapse font-mono text-code-base md:text-code-lg">
          
          {/* Bumped table text from code-sm → base/lg */}

          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-800 bg-gray-200 dark:bg-gray-900 text-code-base font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              {/* Brighter, larger header row */}
              <th className="px-4 py-3 text-left whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={
                    questions.length > 0 && selected.length === questions.length
                  }
                  onChange={() =>
                    selected.length === questions.length
                      ? setSelected([])
                      : setSelected(questions.map(q => q.id))
                  }
                  className="rounded border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-primary focus:ring-primary/50"
                />
              </th>

              {Object.entries(SORT_FIELDS).map(([field, label]) => (
                <th
                  key={field}
                  onClick={() => onSort(field)}
                  className="px-4 py-3 text-left cursor-pointer select-none hover:text-gray-900 dark:hover:text-gray-100 whitespace-nowrap"
                >
                  {label}
                  <span className="text-gray-500">{arrow(field)}</span>
                </th>
              ))}
              <th className="px-4 py-3 text-left whitespace-nowrap">Link</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Ask AI</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Note</th>
              <th className="px-4 py-3 pl-6 text-left whitespace-nowrap">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-300 dark:divide-gray-800 text-gray-900 dark:text-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={Object.keys(SORT_FIELDS).length + 5}
                  className="px-4 py-4 text-center"
                >
                  <Spinner size={20} className="mx-auto" />
                </td>
              </tr>
            ) : questions.length ? (
              questions.map(q => (
                <tr
                  key={q.id}
                  className={`hover:bg-gray-300 dark:hover:bg-gray-900/50 transition-colors duration-150 ${
                    !q.solved ? 'font-bold' : 'font-normal opacity-75'
                  }`}
                >
                  {/* Row checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(q.id)}
                      onChange={() =>
                        setSelected(prev =>
                          prev.includes(q.id)
                            ? prev.filter(x => x !== q.id)
                            : [...prev, q.id]
                        )
                      }
                      className="rounded border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-primary focus:ring-primary/50"
                    />
                  </td>

                  {/* Title */}
                  <td className="px-4 py-3">
                    <a
                      href={q.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: getTitleColor(q) }}
                      className="hover:underline"
                    >
                      {q.title}
                    </a>
                  </td>

                  {/* Frequency */}
                  <td className="px-4 py-3">{q.frequency}</td>

                  {/* Acceptance Rate */}
                  <td className="px-4 py-3">
                    {(q.acceptanceRate * 100).toFixed(1)}%
                  </td>

                  {/* Leet Difficulty */}
                  <td className="px-4 py-3">
                    <span style={{ color: getDifficultyColor(q) }}>
                      {q.leetDifficulty}
                    </span>
                  </td>

                  {/* Your Rating dropdown */}
                  <td className="px-4 py-3">
                    <select
                      value={q.userDifficulty || ''}
                      onChange={e =>
                        updateField(q.id, 'userDifficulty', e.target.value)
                      }
                      style={{ color: getYourRatingColor(q) || 'inherit' }}
                      className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <option value="">–</option>
                      <option value="Easy"   style={{ color: easyColor   }}>Easy</option>
                      <option value="Medium" style={{ color: mediumColor }}>Medium</option>
                      <option value="Hard"   style={{ color: hardColor   }}>Hard</option>
                    </select>
                  </td>

                  {/* Link */}
                  <td className="px-4 py-3">
                  <a
                      href={q.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View
                    </a>
                  </td>

                  {/* Ask AI */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <RouterLink
                      to={`/ask-ai/${q.id}`}
                      className="text-primary hover:underline"
                    >
                      Ask AI
                    </RouterLink>
                  </td>

                  {/* Note icon */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        setNoteEditor({ id: q.id, text: q.note || '' })
                      }
                      className="text-primary hover:underline"
                      aria-label={q.note ? 'Edit note' : 'Add note'}
                    >
                      {q.note ? (
                        // Document icon when a note exists
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      ) : (
                        // Pencil icon when no note saved
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L7.5 19.5 3 21l1.5-4.5 12.696-12.768z"
                          />
                        </svg>
                      )}
                    </button>
                  </td>

                  {/* Status (solved checkbox) */}
                  <td className="px-4 py-3 pl-6">
                    <input
                      type="checkbox"
                      checked={q.solved}
                      onChange={e =>
                        updateField(q.id, 'solved', e.target.checked)
                      }
                      className="rounded border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-primary focus:ring-primary/50"
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={Object.keys(SORT_FIELDS).length + 5}
                  className="px-4 py-4 text-center italic text-gray-500 dark:text-gray-400"
                >
                  No questions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Batch action bar */}
      {selected.length > 0 && (
        <div className="sticky bottom-0 bg-surface/95 backdrop-blur border-t border-gray-300 dark:border-gray-800 px-4 py-3 flex items-center gap-4 z-10">
          <strong className="text-gray-700 dark:text-gray-300">{selected.length} selected</strong>
          <button
            onClick={() => batchUpdate({ solved: true })}
            className="font-mono text-code-base bg-transparent hover:bg-gray-300 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-1 rounded border border-gray-300 dark:border-gray-700 transition-colors"
          >
            Mark Solved
          </button>
          <button
            onClick={() => batchUpdate({ solved: false })}
            className="font-mono text-code-base bg-transparent hover:bg-gray-300 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-1 rounded border border-gray-300 dark:border-gray-700 transition-colors"
          >
            Mark Unsolved
          </button>
          <select
            value={batchDifficulty}
            onChange={e => setBatchDifficulty(e.target.value)}
            className="font-mono text-code-base bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-1 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="">Set difficulty…</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <button
            disabled={!batchDifficulty}
            onClick={() => batchUpdate({ userDifficulty: batchDifficulty })}
            className="font-mono text-code-base bg-primary hover:bg-[#2a7aeb] text-white px-3 py-1 rounded transition-colors disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex justify-center items-center gap-4 my-2">
        <button
          onClick={() => setPage(p => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="font-mono text-code-base bg-transparent hover:bg-gray-300 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-4 py-1 rounded border border-gray-300 dark:border-gray-700 transition-colors disabled:opacity-50"
        >
          ← Prev
        </button>
        <span className="text-gray-700 dark:text-gray-300">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="font-mono text-code-base bg-transparent hover:bg-gray-300 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-4 py-1 rounded border border-gray-300 dark:border-gray-700 transition-colors disabled:opacity-50"
        >
          Next →
        </button>
      </div>
      {noteEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-gray-300 dark:border-gray-700 rounded p-4 w-80">
            <textarea
              className="w-full h-32 p-2 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded"
              value={noteEditor.text}
              onChange={e =>
                setNoteEditor({ ...noteEditor, text: e.target.value })
              }
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setNoteEditor(null)}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateField(noteEditor.id, 'note', '');
                  setNoteEditor(null);
                }}
                className="px-3 py-1 bg-red-600 text-white rounded"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  const trimmed = noteEditor.text.trim();
                  updateField(
                    noteEditor.id,
                    'note',
                    trimmed ? noteEditor.text : ''
                  );
                  setNoteEditor(null);
                }}
                className="px-3 py-1 bg-primary text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
