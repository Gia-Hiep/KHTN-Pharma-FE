// File: src/providers/AuthProvider.jsx
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

export const AuthContext = createContext(null);

const STORAGE_TOKEN = 'access_token';
const STORAGE_USER  = 'user';

function readStorage() {
  try {
    const token = localStorage.getItem(STORAGE_TOKEN);
    const user  = JSON.parse(localStorage.getItem(STORAGE_USER) || 'null');
    if (token && user) return { token, user };
  } catch {}
  return null;
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStorage);

  // Listen for auth:logout fired by axios interceptor
  useEffect(() => {
    const handle = () => {
      localStorage.removeItem(STORAGE_TOKEN);
      localStorage.removeItem(STORAGE_USER);
      setAuth(null);
    };
    window.addEventListener('auth:logout', handle);
    return () => window.removeEventListener('auth:logout', handle);
  }, []);

  const login = useCallback(({ token, user }) => {
    localStorage.setItem(STORAGE_TOKEN, token);
    localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    setAuth({ token, user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
    setAuth(null);
  }, []);

  const hasRole = useCallback(
    (role) => auth?.user?.roles?.includes(role) ?? false,
    [auth]
  );

  const hasAnyRole = useCallback(
    (roles) => roles.some((r) => auth?.user?.roles?.includes(r)),
    [auth]
  );

  const value = useMemo(
    () => ({ auth, login, logout, hasRole, hasAnyRole }),
    [auth, login, logout, hasRole, hasAnyRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
