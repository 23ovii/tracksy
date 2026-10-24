import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ReorderVars } from '../api/mutations';
import type { Track } from '../types';

import { useReorderOperation } from './useReorderOperation';

const track: Track = {
  id: 'track-1',
  uri: 'spotify:track:track-1',
  name: 'Track',
  artist: 'Artist',
  album: 'Album',
  albumYear: 2020,
  trackNumber: 1,
  durationMs: 60_000,
  addedAt: '2020-01-01T00:00:00Z',
  popularity: 50,
};

describe('useReorderOperation', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it('owns progress and completion state for a reorder operation', async () => {
    let resolveMutation!: (result: { moves: number }) => void;
    const mutateAsync = vi.fn((_variables: ReorderVars) => new Promise<{ moves: number }>((resolve) => {
      resolveMutation = resolve;
    }));
    let operation!: ReturnType<typeof useReorderOperation>;

    function Probe() {
      operation = useReorderOperation({ mutateAsync, onError: vi.fn() });
      return null;
    }

    await act(async () => root.render(<Probe />));
    const metadata = {
      kind: 'sort' as const,
      playlistId: 'playlist',
      playlistName: 'Playlist',
      sortBy: 'name' as const,
      sortedTracks: [track],
      previousTrackIds: ['track-1'],
      previousTrackKeys: ['track-1#0'],
    };

    await act(async () => {
      expect(operation.start([track], [track], metadata, true)).toBe(true);
    });
    expect(operation.applying).toBe(true);
    const variables = mutateAsync.mock.calls[0]?.[0];
    expect(variables?.abortSignal?.aborted).toBe(false);

    await act(async () => variables?.onProgress?.(65));
    expect(operation.applyProgress).toBe(65);

    let completed: Awaited<ReturnType<typeof operation.complete>> = null;
    await act(async () => {
      resolveMutation({ moves: 1 });
      completed = await operation.complete();
    });

    expect(completed).toEqual({ moves: 1, metadata });
    expect(operation.applying).toBe(false);
    expect(operation.applyProgress).toBe(0);
  });

  it('does not start an operation when the caller marks it unavailable', async () => {
    const mutateAsync = vi.fn(async () => ({ moves: 0 }));
    let operation!: ReturnType<typeof useReorderOperation>;

    function Probe() {
      operation = useReorderOperation({ mutateAsync, onError: vi.fn() });
      return null;
    }

    await act(async () => root.render(<Probe />));
    const metadata = {
      kind: 'sort' as const,
      playlistId: 'playlist',
      playlistName: 'Playlist',
      sortBy: 'name' as const,
      sortedTracks: [track],
      previousTrackIds: ['track-1'],
      previousTrackKeys: ['track-1#0'],
    };

    expect(operation.start([track], [track], metadata, false)).toBe(false);
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('reports a failed operation and clears active progress state', async () => {
    let rejectMutation!: (error: Error) => void;
    const mutateAsync = vi.fn((_variables: ReorderVars) => new Promise<{ moves: number }>((_resolve, reject) => {
      rejectMutation = reject;
    }));
    const onError = vi.fn();
    let operation!: ReturnType<typeof useReorderOperation>;

    function Probe() {
      operation = useReorderOperation({ mutateAsync, onError });
      return null;
    }

    await act(async () => root.render(<Probe />));
    const metadata = {
      kind: 'sort' as const,
      playlistId: 'playlist',
      playlistName: 'Playlist',
      sortBy: 'name' as const,
      sortedTracks: [track],
      previousTrackIds: ['track-1'],
      previousTrackKeys: ['track-1#0'],
    };
    await act(async () => {
      operation.start([track], [track], metadata, true);
    });

    await act(async () => rejectMutation(new Error('Spotify write failed')));
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(new Error('Spotify write failed')));
    expect(operation.applying).toBe(false);
    expect(operation.applyProgress).toBe(0);
    expect(operation.rateLimitMsg).toBe('');
  });
});
