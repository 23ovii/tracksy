import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getSpotifyPlaylistTracks, getSpotifyPlaylists } from '../services/spotify';

import Dashboard from './Dashboard';

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({
    token: 'token',
    user: { id: 'account' },
    isAuthenticated: true,
  }),
}));

vi.mock('../services/spotify', () => ({
  getSpotifyPlaylists: vi.fn(),
  getSpotifyPlaylistTracks: vi.fn(),
  savePlaylistTracks: vi.fn(),
}));

vi.mock('../context/ShortcutsOverlayContext', () => ({
  useShortcutsOverlay: () => ({ open: false, toggle: vi.fn() }),
}));

const playlist = {
  id: 'playlist-1',
  name: 'Test playlist',
  trackCount: 1,
  color1: '#123456',
  color2: '#654321',
};

describe('Dashboard', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.mocked(getSpotifyPlaylists).mockResolvedValue([playlist]);
    vi.mocked(getSpotifyPlaylistTracks).mockRejectedValue(new Error('Spotify unavailable'));
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    queryClient.clear();
    container.remove();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('announces a track-load error and does not enable playlist writes', async () => {
    await act(async () => root.render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>,
    ));

    await vi.waitFor(() => {
      expect([...container.querySelectorAll('button')]
        .some((button) => button.textContent?.includes('Test playlist'))).toBe(true);
    });
    const playlistButton = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Test playlist'))!;

    await act(async () => playlistButton!.click());

    await vi.waitFor(() => {
      expect(container.querySelector('[role="alert"]')?.textContent).toContain(
        'Could not load this playlist’s tracks.',
      );
    });
    const applyButton = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Apply to Spotify'));
    expect(applyButton?.disabled).toBe(true);
  });
});
