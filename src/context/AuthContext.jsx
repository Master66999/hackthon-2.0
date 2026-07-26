import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ── Types / shape ──────────────────────────────────────────────────────────
// user: { id, name, email, avatar, role, firstName } | null
// status: 'loading' | 'authenticated' | 'unauthenticated'

const AuthContext = createContext(null);

const TOKEN_KEY = 'leafsense_token';

/**
 * Fetch the current user from the backend using the stored JWT.
 * Returns the user object on success, null on failure/no token.
 */
async function fetchCurrentUser(token) {
  if (!token) return null;
  try {
    const res = await fetch('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Helper to safely parse JSON response or throw clear connection error
 */
async function safeParseJson(res) {
  let data;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new Error(data.message || `Server error (${res.status}). Please check backend status.`);
  }
  return data;
}

export function AuthProvider({ children }) {
  const [user,   setUser]   = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | unauthenticated

  // ── Bootstrap: read stored token and verify it ─────────────────────────
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setStatus('unauthenticated');
      return;
    }
    fetchCurrentUser(token).then((u) => {
      if (u) {
        setUser(u);
        setStatus('authenticated');
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setStatus('unauthenticated');
      }
    });
  }, []);

  // ── Called by /auth/callback page after reading token from URL ─────────
  const loginWithToken = useCallback(async (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    const u = await fetchCurrentUser(token);
    if (u) {
      setUser(u);
      setStatus('authenticated');
      return true;
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setStatus('unauthenticated');
      return false;
    }
  }, []);

  // ── Login with Email & Password ─────────────────────────────────────────
  const loginWithCredentials = useCallback(async (email, password) => {
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await safeParseJson(res);
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      setStatus('authenticated');
      return { success: true };
    } catch (err) {
      const msg = err.name === 'TypeError'
        ? 'Cannot connect to backend. Please start the backend server (cd server && npm run dev).'
        : err.message;
      return { success: false, error: msg };
    }
  }, []);

  // ── Register with Email & Password ──────────────────────────────────────
  const registerWithCredentials = useCallback(async (name, email, password) => {
    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await safeParseJson(res);
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      setStatus('authenticated');
      return { success: true };
    } catch (err) {
      const msg = err.name === 'TypeError'
        ? 'Cannot connect to backend. Please start the backend server (cd server && npm run dev).'
        : err.message;
      return { success: false, error: msg };
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetch('/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // ── Helper to get a fresh token for API calls ──────────────────────────
  const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        loginWithToken,
        loginWithCredentials,
        registerWithCredentials,
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Hook — use anywhere inside AuthProvider */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
