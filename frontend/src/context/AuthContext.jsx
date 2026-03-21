'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { isAuthenticated, clearTokens, getAccessToken } from '@/lib/auth';
import api from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load: fetch user profile if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (isAuthenticated()) {
        try {
          const res = await api.get('/api/auth/me/');
          setUser(res.data);
        } catch {
          clearTokens();
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = (userData) => setUser(userData);

  const logout = () => {
    clearTokens();
    setUser(null);
    window.location.href = '/';
  };

  // Convenience flags used by every component
  const isCreator = user?.profile?.role === 'creator';
  const isUser    = user?.profile?.role === 'user';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isCreator, isUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — use this in any component: const { user } = useAuth()
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};