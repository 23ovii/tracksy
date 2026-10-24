import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { refreshSpotifyToken } from '../services/auth.ts';
import { getSpotifyCurrentUser } from '../services/spotify.ts';
import type { TokenResponse, AuthContextValue, SpotifyUser } from '../types';
import { TOKEN_REFRESH_LEEWAY_MS } from '../utils/constants.ts';

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
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthState | null>(readSavedAuth);
  const [userState, setUserState] = useState<{ accessToken: string; user: SpotifyUser } | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousAccountIdRef = useRef<string | null>(null);
  const user = userState && userState.accessToken === authState?.access_token ? userState.user : null;

  useEffect(() => {
    if (authState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authState));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [authState]);

  const applyToken = useCallback((tokenResponse: TokenResponse): number => {
    const expiresAt = Date.now() + (tokenResponse.expires_in ?? 3600) * 1000;
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

    const msUntilExpiry = authState.expires_at - Date.now();
    const msUntilRefresh = msUntilExpiry - TOKEN_REFRESH_LEEWAY_MS;

    if (msUntilRefresh <= 0) {
      refreshSpotifyToken(authState.refresh_token)
        .then(applyToken)
        .catch(() => {
          setAuthState(null);
          queryClient.removeQueries({ queryKey: ['playlists'] });
        });
      return;
    }

    refreshTimerRef.current = setTimeout(() => {
      refreshSpotifyToken(authState.refresh_token!)
        .then(applyToken)
        .catch(() => {
          setAuthState(null);
          queryClient.removeQueries({ queryKey: ['playlists'] });
        });
    }, msUntilRefresh);

    return () => clearTimeout(refreshTimerRef.current!);
  }, [authState?.refresh_token, authState?.expires_at, applyToken, queryClient]);

  // Per HTML spec, storage events only fire for other tabs, not the current tab
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        if (event.newValue) {
          try {
            setAuthState(JSON.parse(event.newValue) as AuthState);
          } catch {
            setAuthState(null);
            queryClient.removeQueries({ queryKey: ['playlists'] });
          }
        } else {
          setAuthState(null);
          queryClient.removeQueries({ queryKey: ['playlists'] });
        }
      }
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
        queryClient.removeQueries({ queryKey: ['playlists'] });
      },
    }),
    [authState, isAuthenticated, user, applyToken, queryClient]
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
