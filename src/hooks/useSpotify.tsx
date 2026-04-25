import { useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth.tsx';
import {
  getSpotifyPlaylists,
  getSpotifyPlaylistTracks,
  savePlaylistTracks,
} from '../services/spotify.ts';
import type { Track, Playlist } from '../types';

export function useSpotify() {
  const { token } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const currentPlaylistIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadPlaylists = useCallback(async () => {
    setIsLoading(true);
    setFeedback('');
    try {
      setPlaylists(await getSpotifyPlaylists(token!));
    } catch (error) {
      console.error(error);
      setFeedback('Unable to load Spotify playlists.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const loadPlaylistTracks = useCallback(async (playlist: Playlist) => {
    currentPlaylistIdRef.current = playlist.id;
    setIsLoading(true);
    setFeedback('');
    try {
      const raw = await getSpotifyPlaylistTracks(token!, playlist.id);
      if (currentPlaylistIdRef.current !== playlist.id) return;
      setSelectedPlaylist(playlist);
      setTracks(raw);
    } catch (error) {
      if (currentPlaylistIdRef.current !== playlist.id) return;
      console.error(error);
      setFeedback('Unable to load track details from Spotify.');
    } finally {
      if (currentPlaylistIdRef.current === playlist.id) setIsLoading(false);
    }
  }, [token]);

  const applySort = useCallback(async (
    sortedTracks: Track[],
    onProgress?: (pct: number) => void,
    onRateLimit?: (retryAfterSeconds: number) => void,
  ) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    return savePlaylistTracks(token!, selectedPlaylist!.id, tracks, sortedTracks, onProgress, onRateLimit, controller.signal);
  }, [token, selectedPlaylist, tracks]);

  const cancelSort = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPlaylist(null);
    setTracks([]);
    setFeedback('');
  }, []);

  return {
    playlists,
    tracks,
    selectedPlaylist,
    isLoading,
    feedback,
    loadPlaylists,
    loadPlaylistTracks,
    applySort,
    cancelSort,
    clearSelection,
  };
}
