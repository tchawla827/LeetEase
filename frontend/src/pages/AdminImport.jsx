// src/pages/AdminImport.jsx
import React, { useState } from 'react';
import { uploadQuestions } from '../api';   // ⬅️ new helper wraps the /api/import call

export default function AdminImport() {
  const [file, setFile]       = useState(null);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // ─── Handlers ─────────────────────────────────────────────────────────
  const onFileChange = (e) => {
    setFile(e.target.files[0] ?? null);
    setMessage('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a CSV or Excel file.');
      return;
    }

    setIsUploading(true);
    try {
      const { data } = await uploadQuestions(file);  // uses FormData internally
      const { imported = 0, skipped = 0 } = data;

      let msg = `${imported} question${imported === 1 ? '' : 's'} imported successfully.`;
      if (skipped > 0) {
        msg += ` ${skipped} row${skipped === 1 ? '' : 's'} skipped.`;
      }
      setMessage(msg);
      setFile(null);  // reset picker
    } catch (err) {
      /* istanbul ignore next */
      console.error(err);
      setMessage(
        err.response?.data?.description ||
        'Import failed. Please check the file format and try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  // ─── UI ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto mt-8 p-6 bg-surface rounded-code border border-gray-800 shadow-elevation">
      <h2 className="text-2xl font-mono text-gray-100 mb-4">Admin: Import Questions</h2>

      <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={onFileChange}
            className="block w-full text-code-sm text-gray-300
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-code file:border-0
                       file:text-code-sm file:font-mono
                       file:bg-gray-800 file:text-gray-100
                       hover:file:bg-gray-700
                       cursor-pointer
                       focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <p className="mt-1 text-code-xs text-gray-500">
            {file ? file.name : 'No file selected'}
          </p>
        </div>

        <button
          type="submit"
          disabled={isUploading || !file}
          className={`px-4 py-2 rounded-code text-code-sm font-mono
                      ${isUploading || !file ? 'bg-gray-700 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'}
                      text-white transition-colors duration-150
                      focus:outline-none focus:ring-2 focus:ring-primary/50`}
        >
          {isUploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 p-3 rounded-code font-mono text-code-sm
                      ${message.toLowerCase().includes('failed')
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-green-900/30 text-green-400'}`}
        >
          {message}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-900/50 rounded-code border border-gray-800">
        <h3 className="font-mono text-code-sm text-gray-300 mb-2">File Format Requirements:</h3>
        <ul className="font-mono text-code-xs text-gray-500 list-disc pl-5 space-y-1">
          <li>Accepted file types: <code>.csv</code>, <code>.xlsx</code>, <code>.xls</code></li>
          <li>Required columns (case-insensitive): <strong>title</strong>, <strong>link</strong> (or <strong>url</strong>), <strong>company</strong>, <strong>bucket</strong></li>
          <li>Optional columns: <strong>difficulty</strong>, <strong>frequency</strong>, <strong>acceptanceRate</strong></li>
          <li>First row must be headers; subsequent rows one question each</li>
          <li>Example bucket values: <code>30Days</code>, <code>3Months</code>, <code>6Months</code>, <code>MoreThan6Months</code>, <code>All</code></li>
        </ul>
      </div>
    </div>
  );
}
