import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Track } from '../types';
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

export function useReorderPlaylist(playlistId: string) {
  const qc = useQueryClient();
  const { token } = useAuth();

  return useMutation<{ moves: number }, Error, ReorderVars, { snapshot: Track[] | undefined }>({
    mutationFn: ({ previous, sorted, abortSignal, onProgress, onRateLimit }) =>
      savePlaylistTracks(token!, playlistId, previous, sorted, onProgress, onRateLimit, abortSignal),

    onMutate: async ({ sorted }) => {
      if (!playlistId) return { snapshot: undefined };
      await qc.cancelQueries({ queryKey: playlistKeys.tracks(playlistId) });
      const snapshot = qc.getQueryData<Track[]>(playlistKeys.tracks(playlistId));
      qc.setQueryData(playlistKeys.tracks(playlistId), sorted);
      return { snapshot };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot !== undefined && playlistId) {
        qc.setQueryData(playlistKeys.tracks(playlistId), ctx.snapshot);
      }
    },

    onSettled: () => {
      if (playlistId) {
        qc.invalidateQueries({ queryKey: playlistKeys.tracks(playlistId) });
      }
    },
  });
}
