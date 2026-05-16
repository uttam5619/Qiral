import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, userApi } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap auth state from localStorage on app mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      userApi.me()
        .then(res => setUser(res.data.data))
        .catch(() => {
          localStorage.clear();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    const { accessToken, refreshToken, user: userData } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload);
    return res.data;
  }, []);

  const bootstrap = useCallback(async (payload) => {
    const res = await authApi.bootstrap(payload);
    const { accessToken, refreshToken, user: userData } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    return res.data.data;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try { await authApi.logout(refreshToken); } catch { /* ignore */ }
    }
    localStorage.clear();
    setUser(null);
  }, []);

  const isAdmin    = user?.role === 'admin';
  const isEngineer = ['admin', 'engineer'].includes(user?.role);
  const isAnalyst  = ['admin', 'engineer', 'analyst'].includes(user?.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, bootstrap, logout, isAdmin, isEngineer, isAnalyst }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
