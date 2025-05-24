// frontend/src/components/QuestionsTable.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const difficulties = ['Easy', 'Medium', 'Hard'];

export default function QuestionsTable({ company, bucket }) {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    axios
      .get(`/api/companies/${encodeURIComponent(company)}/buckets/${bucket}/questions`)
      .then(res => setQuestions(res.data))
      .catch(console.error);
  }, [company, bucket]);

  const updateField = (id, field, value) => {
    axios
      .patch(`/api/questions/${id}`, { [field]: value })
      .then(res => {
        // update local state with returned array of updated docs
        setQuestions(prev =>
          prev.map(q =>
            q.link === res.data[0].link // all returned share same link
              ? res.data.find(r => r.id === q.id)
              : q
          )
        );
      })
      .catch(console.error);
  };

  return (
    <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
            <td><a href={q.link} target="_blank" rel="noopener noreferrer">View</a></td>
            <td>{q.frequency}</td>
            <td>{q.acceptanceRate.toFixed(2)}</td>
            <td>{q.leetDifficulty}</td>
            <td>
              <select
                value={q.userDifficulty || ''}
                onChange={e => updateField(q.id, 'userDifficulty', e.target.value)}
              >
                <option value="">–</option>
                {difficulties.map(d => (
                  <option key={d} value={d}>{d}</option>
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
  );
}
