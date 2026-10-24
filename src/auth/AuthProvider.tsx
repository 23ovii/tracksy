import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { refreshSpotifyToken } from '../services/auth.ts';
import { getSpotifyCurrentUser } from '../services/spotify.ts';
import type { TokenResponse, AuthContextValue, SpotifyUser } from '../types';
import { TOKEN_REFRESH_LEEWAY_MS } from '../utils/constants.ts';
import { isRecord } from '../utils/validation';

interface AuthState {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = 'tracksy_auth_state';
const LOGOUT_SIGNAL_KEY = 'tracksy_auth_logout';

function parseSavedAuth(stored: string | null): AuthState | null {
  if (!stored) return null;
  try {
    const value: unknown = JSON.parse(stored);
    if (!isRecord(value) ||
      typeof value.access_token !== 'string' || value.access_token.trim() === '' ||
      typeof value.expires_at !== 'number' || !Number.isFinite(value.expires_at) ||
      value.expires_at <= 0 ||
      (value.refresh_token !== undefined &&
        (typeof value.refresh_token !== 'string' || value.refresh_token.trim() === ''))
    ) {
      return null;
    }
    return {
      access_token: value.access_token,
      expires_at: value.expires_at,
      ...(typeof value.refresh_token === 'string' ? { refresh_token: value.refresh_token } : {}),
    };
  } catch {
    return null;
  }
}

function readSavedAuth(): AuthState | null {
  const savedInSession = sessionStorage.getItem(STORAGE_KEY);
  const savedInLocalStorage = localStorage.getItem(STORAGE_KEY);
  if (savedInLocalStorage) localStorage.removeItem(STORAGE_KEY);

  const sessionAuth = parseSavedAuth(savedInSession);
  const auth = sessionAuth ?? parseSavedAuth(savedInLocalStorage);
  if (!auth) {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }

  if (!sessionAuth) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  }
  return auth;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthState | null>(readSavedAuth);
  const [userState, setUserState] = useState<{ accessToken: string; user: SpotifyUser } | null>(null);
  const authGenerationRef = useRef(0);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousAccountIdRef = useRef<string | null>(null);
  const user = userState && userState.accessToken === authState?.access_token ? userState.user : null;

  useEffect(() => {
    if (authState) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authState));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [authState]);

  const applyToken = useCallback((tokenResponse: TokenResponse): number => {
    authGenerationRef.current += 1;
    const expiresAt = Date.now() + tokenResponse.expires_in * 1000;
    const token = tokenResponse.refresh_token ?? authState?.refresh_token;
    setAuthState({
      access_token: tokenResponse.access_token,
      expires_at: expiresAt,
      ...(token !== undefined ? { refresh_token: token } : {}),
    });
    return expiresAt;
  }, [authState?.refresh_token]);

  useEffect(() => {
    if (!authState?.refresh_token || !authState?.expires_at) return;

    let active = true;
    const generation = authGenerationRef.current;
    const refreshToken = authState.refresh_token;
    const msUntilExpiry = authState.expires_at - Date.now();
    const msUntilRefresh = msUntilExpiry - TOKEN_REFRESH_LEEWAY_MS;

    const refresh = () => {
      refreshSpotifyToken(refreshToken)
        .then((tokenResponse) => {
          if (active && generation === authGenerationRef.current) applyToken(tokenResponse);
        })
        .catch(() => {
          if (!active || generation !== authGenerationRef.current) return;
          authGenerationRef.current += 1;
          setAuthState(null);
          queryClient.removeQueries({ queryKey: ['playlists'] });
        });
    };

    if (msUntilRefresh <= 0) {
      refresh();
    } else {
      refreshTimerRef.current = setTimeout(refresh, msUntilRefresh);
    }

    return () => {
      active = false;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [authState?.refresh_token, authState?.expires_at, applyToken, queryClient]);

  // Per HTML spec, storage events only fire for other tabs, not the current tab
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== LOGOUT_SIGNAL_KEY && event.key !== STORAGE_KEY && event.key !== null) return;
      if (event.key === STORAGE_KEY && event.newValue) return;

      authGenerationRef.current += 1;
      sessionStorage.removeItem(STORAGE_KEY);
      setAuthState(null);
      queryClient.removeQueries({ queryKey: ['playlists'] });
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [queryClient]);

  const isAuthenticated = Boolean(
    authState?.access_token && authState.expires_at && authState.expires_at > Date.now()
  );

  useEffect(() => {
    let active = true;
    setUserState(null);
    if (!isAuthenticated || !authState?.access_token) {
      return () => { active = false; };
    }
    const accessToken = authState.access_token;
    getSpotifyCurrentUser(accessToken)
      .then((nextUser) => {
        if (active) setUserState({ accessToken, user: nextUser });
      })
      .catch(() => {
        if (active) setUserState(null);
      });
    return () => { active = false; };
  }, [isAuthenticated, authState?.access_token]);

  useEffect(() => {
    if (!user) return;
    const previousAccountId = previousAccountIdRef.current;
    if (previousAccountId && previousAccountId !== user.id) {
      queryClient.removeQueries({ queryKey: ['playlists', previousAccountId] });
    }
    previousAccountIdRef.current = user.id;
  }, [user, queryClient]);

  const logout = useCallback(() => {
    authGenerationRef.current += 1;
    setAuthState(null);
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(LOGOUT_SIGNAL_KEY, String(Date.now()));
    localStorage.removeItem(LOGOUT_SIGNAL_KEY);
    queryClient.removeQueries({ queryKey: ['playlists'] });
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: authState?.access_token ?? null,
      refreshToken: authState?.refresh_token ?? null,
      expiresAt: authState?.expires_at ?? null,
      isAuthenticated,
      user,
      login: applyToken,
      logout,
    }),
    [authState, isAuthenticated, user, applyToken, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
