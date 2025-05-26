// src/components/PrivateRoute.jsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';

export default function PrivateRoute({ children }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn]   = useState(false);

  useEffect(() => {
    api.get('/api/ping')
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false))
      .finally(() => setAuthChecked(true));
  }, []);

  if (!authChecked) {
    return <div>Loading…</div>;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
