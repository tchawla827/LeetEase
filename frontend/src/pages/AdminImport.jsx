import React, { useState } from 'react';
import api from '../api';

export default function AdminImport() {
  const [file, setFile]       = useState(null);
  const [message, setMessage] = useState('');

  const onFileChange = e => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleUpload = async e => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a CSV file.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/api/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(`${res.data.imported} questions imported.`);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.description || 'Import failed.');
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Admin: Import Questions CSV</h2>
      <form onSubmit={handleUpload}>
        <input type="file" accept=".csv" onChange={onFileChange} />
        <button type="submit" style={{ marginLeft: '0.5rem' }}>
          Upload
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
