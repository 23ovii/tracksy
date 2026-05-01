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
  const lastOriginalTracksRef = useRef<Track[]>([]);
  const lastSortedTracksRef = useRef<Track[]>([]);

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
    lastOriginalTracksRef.current = [...tracks];
    lastSortedTracksRef.current = [...sortedTracks];
    const controller = new AbortController();
    abortControllerRef.current = controller;
    return savePlaylistTracks(token!, selectedPlaylist!.id, tracks, sortedTracks, onProgress, onRateLimit, controller.signal);
  }, [token, selectedPlaylist, tracks]);

  const undoLastSort = useCallback(async (
    onProgress?: (pct: number) => void,
    onRateLimit?: (retryAfterSeconds: number) => void,
  ) => {
    if (!lastOriginalTracksRef.current.length) throw new Error('No sort to undo.');
    const controller = new AbortController();
    abortControllerRef.current = controller;
    return savePlaylistTracks(
      token!,
      selectedPlaylist!.id,
      lastSortedTracksRef.current,
      lastOriginalTracksRef.current,
      onProgress,
      onRateLimit,
      controller.signal,
    );
  }, [token, selectedPlaylist]);

  const restoreOrder = useCallback(async (
    targetIds: string[],
    onProgress?: (pct: number) => void,
    onRateLimit?: (retryAfterSeconds: number) => void,
  ) => {
    // Build per-ID queues so that duplicate tracks (same ID, different objects)
    // are matched by occurrence order rather than all mapping to the same object.
    const queues = new Map<string, Track[]>();
    for (const t of tracks) {
      const q = queues.get(t.id) ?? [];
      q.push(t);
      queues.set(t.id, q);
    }
    const consumed = new Map<string, number>();
    const restoredTracks = targetIds.flatMap((id) => {
      const q = queues.get(id);
      if (!q) return [];
      const idx = consumed.get(id) ?? 0;
      consumed.set(id, idx + 1);
      return idx < q.length ? [q[idx]] : [];
    });
    lastOriginalTracksRef.current = [...tracks];
    lastSortedTracksRef.current = restoredTracks;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    return savePlaylistTracks(token!, selectedPlaylist!.id, tracks, restoredTracks, onProgress, onRateLimit, controller.signal);
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
    undoLastSort,
    restoreOrder,
    cancelSort,
    clearSelection,
  };
}
