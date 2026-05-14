import { useQuery } from '@tanstack/react-query';

import type { Playlist, Track } from '../types';
import { useAuth } from '../hooks/useAuth';
import { getSpotifyPlaylists, getSpotifyPlaylistTracks } from '../services/spotify';

export const playlistKeys = {
  all: ['playlists'] as const,
  lists: () => [...playlistKeys.all, 'list'] as const,
  tracks: (id: string) => [...playlistKeys.all, id, 'tracks'] as const,
};

export function usePlaylists() {
  const { token } = useAuth();
  return useQuery<Playlist[]>({
    queryKey: playlistKeys.lists(),
    queryFn: () => getSpotifyPlaylists(token!),
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
  });
}

export function usePlaylistTracks(playlistId: string | null) {
  const { token } = useAuth();
  return useQuery<Track[]>({
    queryKey: playlistId ? playlistKeys.tracks(playlistId) : ['__skip__'],
    queryFn: () => getSpotifyPlaylistTracks(token!, playlistId!),
    enabled: Boolean(token && playlistId),
    staleTime: 60_000,
  });
}
