import { createContext, useEffect, useMemo, useState } from 'react';

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

  useEffect(() => {
    if (authState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authState));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [authState]);

  const isAuthenticated = Boolean(
    authState?.access_token && authState.expires_at && authState.expires_at > Date.now()
  );

  const value = useMemo(
    () => ({
      token: authState?.access_token ?? null,
      refreshToken: authState?.refresh_token ?? null,
      expiresAt: authState?.expires_at ?? null,
      isAuthenticated,
      login(tokenResponse) {
        const expiresAt = Date.now() + (tokenResponse.expires_in ?? 3600) * 1000;
        setAuthState({
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_at: expiresAt,
        });
      },
      logout() {
        setAuthState(null);
      },
    }),
    [authState, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
