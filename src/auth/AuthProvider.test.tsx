import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { refreshSpotifyToken } from '../services/auth.ts';
import { getSpotifyCurrentUser } from '../services/spotify.ts';
import type { TokenResponse } from '../types';

import { AuthProvider, useAuth } from './AuthProvider';

vi.mock('../services/auth.ts', () => ({
  refreshSpotifyToken: vi.fn(),
}));

vi.mock('../services/spotify.ts', () => ({
  getSpotifyCurrentUser: vi.fn(),
}));

function AuthProbe() {
  const { token, login, logout } = useAuth();
  return (
    <>
      <button onClick={logout}>{token ?? 'logged out'}</button>
      <button onClick={() => login({
        access_token: 'new-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
      })}>
        Login
      </button>
    </>
  );
}

describe('AuthProvider', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.mocked(refreshSpotifyToken).mockReset();
    vi.mocked(getSpotifyCurrentUser).mockResolvedValue({
      id: 'account',
      display_name: 'Account',
      images: [],
    });
    localStorage.clear();
    sessionStorage.clear();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    queryClient.clear();
    container.remove();
    vi.unstubAllGlobals();
  });

  it('does not restore auth when a pending token refresh completes after logout', async () => {
    let resolveRefresh!: (response: TokenResponse) => void;
    vi.mocked(refreshSpotifyToken).mockReturnValue(
      new Promise((resolve) => { resolveRefresh = resolve; }),
    );
    sessionStorage.setItem('tracksy_auth_state', JSON.stringify({
      access_token: 'expired-token',
      refresh_token: 'refresh-token',
      expires_at: Date.now() - 1,
    }));

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider><AuthProbe /></AuthProvider>
        </QueryClientProvider>,
      );
    });

    expect(refreshSpotifyToken).toHaveBeenCalledOnce();

    await act(async () => {
      container.querySelector('button')!.click();
    });

    expect(container.querySelector('button')?.textContent).toBe('logged out');
    expect(localStorage.getItem('tracksy_auth_state')).toBeNull();
    expect(localStorage.getItem('tracksy_auth_logout')).toBeNull();
    expect(sessionStorage.getItem('tracksy_auth_state')).toBeNull();

    await act(async () => {
      resolveRefresh({ access_token: 'new-token', expires_in: 3600 });
    });

    expect(container.querySelector('button')?.textContent).toBe('logged out');
    expect(localStorage.getItem('tracksy_auth_state')).toBeNull();
    expect(sessionStorage.getItem('tracksy_auth_state')).toBeNull();
  });

  it('logs out when another tab clears local storage', async () => {
    sessionStorage.setItem('tracksy_auth_state', JSON.stringify({
      access_token: 'valid-token',
      refresh_token: 'refresh-token',
      expires_at: Date.now() + 5 * 60_000,
    }));

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider><AuthProbe /></AuthProvider>
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: null, newValue: null }));
    });

    expect(container.querySelector('button')?.textContent).toBe('logged out');
    expect(sessionStorage.getItem('tracksy_auth_state')).toBeNull();
  });

  it('migrates existing auth state from local storage into session storage', async () => {
    localStorage.setItem('tracksy_auth_state', JSON.stringify({
      access_token: 'valid-token',
      refresh_token: 'refresh-token',
      expires_at: Date.now() + 5 * 60_000,
    }));

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider><AuthProbe /></AuthProvider>
        </QueryClientProvider>,
      );
    });

    expect(container.querySelector('button')?.textContent).toBe('valid-token');
    expect(localStorage.getItem('tracksy_auth_state')).toBeNull();
    expect(JSON.parse(sessionStorage.getItem('tracksy_auth_state')!).refresh_token).toBe('refresh-token');
  });

  it('stores newly granted tokens in session storage only', async () => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider><AuthProbe /></AuthProvider>
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      container.querySelectorAll('button').item(1)!.click();
    });

    expect(JSON.parse(sessionStorage.getItem('tracksy_auth_state')!).access_token).toBe('new-token');
    expect(localStorage.getItem('tracksy_auth_state')).toBeNull();
  });

  it('logs out when another tab broadcasts a logout signal', async () => {
    sessionStorage.setItem('tracksy_auth_state', JSON.stringify({
      access_token: 'valid-token',
      refresh_token: 'refresh-token',
      expires_at: Date.now() + 5 * 60_000,
    }));

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider><AuthProbe /></AuthProvider>
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'tracksy_auth_logout',
        newValue: String(Date.now()),
      }));
    });

    expect(container.querySelector('button')?.textContent).toBe('logged out');
    expect(sessionStorage.getItem('tracksy_auth_state')).toBeNull();
  });
});
