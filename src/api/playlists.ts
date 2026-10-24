import { useQuery } from '@tanstack/react-query';

import type { Playlist, PlaylistTracksResult } from '../types';
import { useAuth } from '../auth/AuthProvider';
import { getSpotifyPlaylists, getSpotifyPlaylistTracks } from '../services/spotify';

export const playlistKeys = {
  all: ['playlists'] as const,
  lists: (accountId: string) => [...playlistKeys.all, accountId, 'list'] as const,
  tracks: (accountId: string, id: string) => [...playlistKeys.all, accountId, id, 'tracks'] as const,
};

export function usePlaylists() {
  const { token, user, isAuthenticated } = useAuth();
  return useQuery<Playlist[]>({
    queryKey: user ? playlistKeys.lists(user.id) : [...playlistKeys.all, '__skip__'],
    queryFn: () => getSpotifyPlaylists(token!),
    enabled: Boolean(token && user && isAuthenticated),
    staleTime: 5 * 60_000,
  });
}

export function usePlaylistTracks(playlistId: string | null) {
  const { token, user, isAuthenticated } = useAuth();
  return useQuery<PlaylistTracksResult>({
    queryKey: playlistId && user ? playlistKeys.tracks(user.id, playlistId) : [...playlistKeys.all, '__skip__'],
    queryFn: () => getSpotifyPlaylistTracks(token!, playlistId!),
    enabled: Boolean(token && user && isAuthenticated && playlistId),
    staleTime: 60_000,
  });
}
