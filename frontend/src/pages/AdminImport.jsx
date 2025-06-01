import React, { useState } from 'react';
import api from '../api';

export default function AdminImport() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a CSV file.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/api/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(`${res.data.imported} questions imported successfully!`);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.description || 'Import failed. Please check the file format and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8 p-6 bg-surface rounded-code border border-gray-800 shadow-elevation">
      <h2 className="text-2xl font-mono text-gray-100 mb-4">Admin: Import Questions CSV</h2>
      
      <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="file"
            accept=".csv"
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
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-code font-mono text-code-sm 
                        ${message.includes('failed') ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
          {message}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-900/50 rounded-code border border-gray-800">
        <h3 className="font-mono text-code-sm text-gray-300 mb-2">CSV Format Requirements:</h3>
        <ul className="font-mono text-code-xs text-gray-500 list-disc pl-5 space-y-1">
          <li>Must include columns: title, url, difficulty, tags</li>
          <li>Tags should be semicolon-separated</li>
          <li>First row should be headers</li>
        </ul>
      </div>
    </div>
  );
}