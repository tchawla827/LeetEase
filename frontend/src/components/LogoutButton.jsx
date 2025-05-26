import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error(err);
    } finally {
      navigate('/login');
    }
  };

  return <button onClick={handleLogout}>Logout</button>;
}
