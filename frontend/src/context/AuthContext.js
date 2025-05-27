// src/context/AuthContext.js

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // On mount: restore from localStorage, then refresh from server
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }

    api.get('/auth/me')
      .then(res => {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('user');
      });
  }, []);

  // email/password login → fetch profile → set user
  const login = async (email, password) => {
    await api.post('/auth/login', { email, password });
    const res = await api.get('/auth/me');
    setUser(res.data);
    localStorage.setItem('user', JSON.stringify(res.data));
  };

  // logout on server + clear client state
  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
