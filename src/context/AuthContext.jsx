import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { refreshSpotifyToken } from '../services/auth.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'tracksy_auth_state';

function readSavedAuth() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(readSavedAuth);
  const refreshTimerRef = useRef(null);

  useEffect(() => {
    if (authState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authState));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [authState]);

  const applyToken = useCallback((tokenResponse) => {
    const expiresAt = Date.now() + (tokenResponse.expires_in ?? 3600) * 1000;
    setAuthState({
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token ?? authState?.refresh_token,
      expires_at: expiresAt,
    });
    return expiresAt;
  }, [authState?.refresh_token]);

  useEffect(() => {
    if (!authState?.refresh_token || !authState?.expires_at) return;

    const msUntilExpiry = authState.expires_at - Date.now();
    const msUntilRefresh = msUntilExpiry - 60_000; // refresh 1 minute early

    if (msUntilRefresh <= 0) {
      refreshSpotifyToken(authState.refresh_token)
        .then(applyToken)
        .catch(() => setAuthState(null));
      return;
    }

    refreshTimerRef.current = setTimeout(() => {
      refreshSpotifyToken(authState.refresh_token)
        .then(applyToken)
        .catch(() => setAuthState(null));
    }, msUntilRefresh);

    return () => clearTimeout(refreshTimerRef.current);
  }, [authState?.refresh_token, authState?.expires_at, applyToken]);

  const isAuthenticated = Boolean(
    authState?.access_token && authState.expires_at && authState.expires_at > Date.now()
  );

  const value = useMemo(
    () => ({
      token: authState?.access_token ?? null,
      refreshToken: authState?.refresh_token ?? null,
      expiresAt: authState?.expires_at ?? null,
      isAuthenticated,
      login: applyToken,
      logout() {
        setAuthState(null);
      },
    }),
    [authState, isAuthenticated, applyToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
