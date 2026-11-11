import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore, errMessage } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

/**
 * Holds the current user + auth actions. On mount, if we have a stored token,
 * we fetch /auth/me to rehydrate the session. A global 'auth:logout' event
 * (fired by the axios interceptor when refresh fails) forces a clean logout.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((data) => {
    if (data.accessToken) tokenStore.set(data);
    setUser(data.user);
    connectSocket();
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* stateless logout — ignore network errors */
    }
    tokenStore.clear();
    setUser(null);
    disconnectSocket();
  }, []);

  // Rehydrate on first load.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!tokenStore.access) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        if (active) {
          setUser(data.data.user);
          connectSocket();
        }
      } catch {
        tokenStore.clear();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Forced logout from the axios refresh-failure path.
  useEffect(() => {
    const handler = () => {
      setUser(null);
      disconnectSocket();
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      applySession(data.data);
      return data.data.user;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await api.post('/auth/register', payload);
      applySession(data.data);
      return data.data.user;
    },
    [applySession]
  );

  const updateUser = useCallback((patch) => {
    setUser((u) => (u ? { ...u, ...patch } : u));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      role: user?.role || null,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export { errMessage };
