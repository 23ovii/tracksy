import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlaylistTracksResult, Track } from '../types';
import { savePlaylistTracks } from '../services/spotify';

import { useReorderPlaylist } from './mutations';
import { playlistKeys } from './playlists';

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ token: 'token', user: { id: 'account' } }),
}));

vi.mock('../services/spotify', () => ({
  savePlaylistTracks: vi.fn(),
}));

const playlistId = 'playlist';
const queryKey = playlistKeys.tracks('account', playlistId);

function makeTrack(id: string): Track {
  return {
    id,
    uri: `spotify:track:${id}`,
    name: id,
    artist: 'artist',
    album: 'album',
    albumYear: 2020,
    trackNumber: 1,
    durationMs: 1000,
    addedAt: '2020-01-01',
    popularity: 50,
  };
}

describe('useReorderPlaylist', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let queryClient: QueryClient;
  let runMutation: ReturnType<typeof useReorderPlaylist>['mutateAsync'] | undefined;
  let currentTracks: PlaylistTracksResult['tracks'] | undefined;

  beforeEach(() => {
    vi.mocked(savePlaylistTracks).mockReset();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    runMutation = undefined;
    currentTracks = undefined;
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    queryClient.clear();
    container.remove();
    vi.unstubAllGlobals();
  });

  it('waits for Spotify order refetch after a failed reorder', async () => {
    const original = [makeTrack('first'), makeTrack('second')];
    const sorted = [...original].reverse();
    const actualSpotifyOrder = [makeTrack('second'), makeTrack('first')];
    let resolveRefetch!: (result: PlaylistTracksResult) => void;
    const refetchPromise = new Promise<PlaylistTracksResult>((resolve) => {
      resolveRefetch = resolve;
    });
    vi.mocked(savePlaylistTracks).mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    queryClient.setQueryData<PlaylistTracksResult>(queryKey, {
      tracks: original,
      unsupportedCount: 0,
    });

    function Probe() {
      const query = useQuery<PlaylistTracksResult>({
        queryKey,
        queryFn: () => refetchPromise,
      });
      const mutation = useReorderPlaylist(playlistId, 0);
      runMutation = mutation.mutateAsync;
      currentTracks = query.data?.tracks;
      return null;
    }

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <Probe />
        </QueryClientProvider>,
      );
    });

    let settled = false;
    const mutationPromise = runMutation!({
      previous: original,
      sorted,
    }).finally(() => {
      settled = true;
    });
    void mutationPromise.catch(() => {});

    await vi.waitFor(() => {
      expect(queryClient.getQueryState(queryKey)?.fetchStatus).toBe('fetching');
    });
    expect(settled).toBe(false);
    expect(currentTracks?.map((track) => track.id)).toEqual(original.map((track) => track.id));

    await act(async () => {
      resolveRefetch({ tracks: actualSpotifyOrder, unsupportedCount: 0 });
      await refetchPromise;
    });
    await expect(mutationPromise).rejects.toMatchObject({ name: 'AbortError' });

    expect(queryClient.getQueryData<PlaylistTracksResult>(queryKey)?.tracks.map((track) => track.id)).toEqual([
      'second',
      'first',
    ]);
  });
});
