import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { PlaylistTracksResult, Track } from '../types';
import { useAuth } from '../auth/AuthProvider';
import { savePlaylistTracks } from '../services/spotify';

import { playlistKeys } from './playlists';

export interface ReorderVars {
  previous: Track[];
  sorted: Track[];
  abortSignal?: AbortSignal;
  onProgress?: (pct: number) => void;
  onRateLimit?: (retryAfterSeconds: number) => void;
}

export function useReorderPlaylist(playlistId: string, unsupportedCount: number) {
  const qc = useQueryClient();
  const { token, user } = useAuth();
  const accountId = user?.id;
  const queryKey = accountId ? playlistKeys.tracks(accountId, playlistId) : null;

  return useMutation<{ moves: number }, Error, ReorderVars, { snapshot: Track[] | undefined }>({
    mutationFn: ({ previous, sorted, abortSignal, onProgress, onRateLimit }) =>
      savePlaylistTracks(token!, playlistId, previous, sorted, onProgress, onRateLimit, abortSignal, unsupportedCount),

    onMutate: async ({ sorted }) => {
      if (!playlistId || !queryKey || unsupportedCount > 0) return { snapshot: undefined };
      await qc.cancelQueries({ queryKey });
      const snapshot = qc.getQueryData<PlaylistTracksResult>(queryKey)?.tracks;
      qc.setQueryData<PlaylistTracksResult>(queryKey, (current) =>
        current ? { ...current, tracks: sorted } : current,
      );
      return { snapshot };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot !== undefined && queryKey) {
        qc.setQueryData<PlaylistTracksResult>(queryKey, (current) =>
          current ? { ...current, tracks: ctx.snapshot! } : current,
        );
      }
    },

    onSettled: () => {
      if (queryKey) {
        return qc.invalidateQueries({ queryKey });
      }
    },
  });
}
