import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { refreshSpotifyToken } from '../services/auth.ts';
import { getSpotifyCurrentUser } from '../services/spotify.ts';
import type { TokenResponse, AuthContextValue, SpotifyUser } from '../types';

interface AuthState {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = 'tracksy_auth_state';

function readSavedAuth(): AuthState | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as AuthState;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState | null>(readSavedAuth);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (authState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authState));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [authState]);

  const applyToken = useCallback((tokenResponse: TokenResponse): number => {
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
    const msUntilRefresh = msUntilExpiry - 60_000;

    if (msUntilRefresh <= 0) {
      refreshSpotifyToken(authState.refresh_token)
        .then(applyToken)
        .catch(() => setAuthState(null));
      return;
    }

    refreshTimerRef.current = setTimeout(() => {
      refreshSpotifyToken(authState.refresh_token!)
        .then(applyToken)
        .catch(() => setAuthState(null));
    }, msUntilRefresh);

    return () => clearTimeout(refreshTimerRef.current!);
  }, [authState?.refresh_token, authState?.expires_at, applyToken]);

  // Sync auth state across tabs via storage events
  // Per HTML spec, storage events only fire for other tabs, not the current tab,
  // so the localStorage write above won't trigger this listener
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        if (event.newValue) {
          try {
            setAuthState(JSON.parse(event.newValue) as AuthState);
          } catch {
            setAuthState(null);
          }
        } else {
          setAuthState(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isAuthenticated = Boolean(
    authState?.access_token && authState.expires_at && authState.expires_at > Date.now()
  );

  useEffect(() => {
    if (!isAuthenticated || !authState?.access_token) {
      setUser(null);
      return;
    }
    getSpotifyCurrentUser(authState.access_token)
      .then(setUser)
      .catch(() => setUser(null));
  }, [isAuthenticated, authState?.access_token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: authState?.access_token ?? null,
      refreshToken: authState?.refresh_token ?? null,
      expiresAt: authState?.expires_at ?? null,
      isAuthenticated,
      user,
      login: applyToken,
      logout() {
        setAuthState(null);
      },
    }),
    [authState, isAuthenticated, user, applyToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
