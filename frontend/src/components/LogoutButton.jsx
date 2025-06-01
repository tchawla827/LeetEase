import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      navigate('/login');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="font-mono text-code-sm text-gray-300 hover:text-white
                px-3 py-1.5 rounded-code transition-colors duration-150
                bg-transparent border border-gray-700 hover:bg-gray-800
                focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-opacity-50"
      aria-label="Logout"
    >
      Logout
    </button>
  );
}