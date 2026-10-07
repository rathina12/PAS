// ============================================================
// context/AuthContext.js - Global Authentication State
// ============================================================
// React Context lets us share state (like current user info)
// across ALL components without passing props manually.

import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Create the context object
export const AuthContext = createContext(null);

// NOTE: We rely on the "proxy": "http://localhost:5000" in package.json
// for development. Do NOT set axios.defaults.baseURL here — it would
// bypass the proxy and cause CORS errors.

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set the Authorization header for all axios requests
  // whenever the token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // On app load, fetch the current user if a token exists
  const fetchCurrentUser = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data.user);
    } catch {
      // Token is invalid or expired
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);

    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchCurrentUser(); }, [fetchCurrentUser]);

  // Login function - called from Login component
  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    return res.data;
  };

  // Logout - clear everything
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = { user, token, loading, login, logout, setUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
