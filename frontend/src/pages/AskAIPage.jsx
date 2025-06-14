import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import Loading from '../components/Loading';

export default function AskAIPage() {
  const { questionId } = useParams();
  const [question, setQuestion] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get(`/api/questions/${questionId}`)
      .then(res => setQuestion(res.data))
      .catch(() => {});
    api.get(`/api/ask-ai/${questionId}`)
      .then(res => setMessages(res.data.thread || []))
      .catch(() => {});
  }, [questionId]);

  const send = () => {
    if (!input.trim()) return;
    setSending(true);
    api.post(`/api/ask-ai/${questionId}`, { message: input })
      .then(res => setMessages(res.data.thread || []))
      .catch(() => {})
      .finally(() => {
        setInput('');
        setSending(false);
      });
  };

  if (!question) {
    return <Loading message="Loading question…" />;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold text-primary">{question.title}</h1>
      {question.content && (
        <div className="prose dark:prose-invert border border-gray-300 dark:border-gray-700 p-4 rounded">
          <div dangerouslySetInnerHTML={{ __html: question.content }} />
        </div>
      )}
      <div className="space-y-2">
        {messages.map((m, idx) => (
          <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block px-3 py-2 rounded ${m.role === 'user' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-800"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
        />
        <button
          onClick={send}
          disabled={sending}
          className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

