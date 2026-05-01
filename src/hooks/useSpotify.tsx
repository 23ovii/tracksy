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
  // Tracks the actual current Spotify order, updated after every successful write.
  const currentSpotifyOrderRef = useRef<Track[]>([]);

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
      currentSpotifyOrderRef.current = raw;
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
    const baseline = currentSpotifyOrderRef.current.length > 0 ? currentSpotifyOrderRef.current : tracks;
    lastOriginalTracksRef.current = [...baseline];
    lastSortedTracksRef.current = [...sortedTracks];
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const result = await savePlaylistTracks(token!, selectedPlaylist!.id, baseline, sortedTracks, onProgress, onRateLimit, controller.signal);
    currentSpotifyOrderRef.current = [...sortedTracks];
    return result;
  }, [token, selectedPlaylist, tracks]);

  const undoLastSort = useCallback(async (
    onProgress?: (pct: number) => void,
    onRateLimit?: (retryAfterSeconds: number) => void,
  ) => {
    if (!lastOriginalTracksRef.current.length) throw new Error('No sort to undo.');
    const original = lastOriginalTracksRef.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const result = await savePlaylistTracks(
      token!,
      selectedPlaylist!.id,
      lastSortedTracksRef.current,
      original,
      onProgress,
      onRateLimit,
      controller.signal,
    );
    currentSpotifyOrderRef.current = [...original];
    return result;
  }, [token, selectedPlaylist]);

  const restoreOrder = useCallback(async (
    targetIds: string[],
    onProgress?: (pct: number) => void,
    onRateLimit?: (retryAfterSeconds: number) => void,
  ) => {
    // Always use currentSpotifyOrderRef so we diff against the real current
    // Spotify state, regardless of how many sorts/undos have happened.
    const baseline = currentSpotifyOrderRef.current.length > 0
      ? currentSpotifyOrderRef.current
      : tracks;

    // Queue-based matching so duplicate track IDs map to distinct objects by
    // occurrence order rather than all collapsing to one object.
    const queues = new Map<string, Track[]>();
    for (const t of baseline) {
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

    lastOriginalTracksRef.current = [...baseline];
    lastSortedTracksRef.current = [...restoredTracks];
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const result = await savePlaylistTracks(token!, selectedPlaylist!.id, baseline, restoredTracks, onProgress, onRateLimit, controller.signal);
    currentSpotifyOrderRef.current = [...restoredTracks];
    return result;
  }, [token, selectedPlaylist, tracks]);

  const cancelSort = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPlaylist(null);
    setTracks([]);
    setFeedback('');
    currentSpotifyOrderRef.current = [];
    lastOriginalTracksRef.current = [];
    lastSortedTracksRef.current = [];
  }, []);

  const getCurrentOrder = useCallback(
    () => (currentSpotifyOrderRef.current.length > 0 ? currentSpotifyOrderRef.current : tracks),
    [tracks],
  );

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
    getCurrentOrder,
  };
}
