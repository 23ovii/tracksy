import { useState, useCallback } from 'react';
import { useAuth } from './useAuth.jsx';
import {
  getSpotifyPlaylists,
  getSpotifyPlaylistTracks,
  getAudioFeatures,
  savePlaylistTracks,
} from '../services/spotify.js';

export function useSpotify() {
  const { token } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadPlaylists = useCallback(async () => {
    setIsLoading(true);
    setFeedback('');
    try {
      setPlaylists(await getSpotifyPlaylists(token));
    } catch (error) {
      console.error(error);
      setFeedback('Unable to load Spotify playlists.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const loadPlaylistTracks = useCallback(async (playlist) => {
    setIsLoading(true);
    setFeedback('');
    try {
      const raw = await getSpotifyPlaylistTracks(token, playlist.id);
      setSelectedPlaylist(playlist);
      setTracks(raw);
      setIsLoading(false);

      // Audio features are optional — enrich in the background if available
      const ids = raw.map((t) => t.id).filter((id) => id && !id.startsWith('spotify:local:'));
      if (ids.length) {
        try {
          const features = await getAudioFeatures(token, ids);
          setTracks(raw.map((t) => ({
            ...t,
            bpm: features[t.id]?.bpm ?? 0,
            energy: features[t.id]?.energy ?? 0,
          })));
        } catch {
          // Audio features unavailable — tracks still show without BPM/energy
        }
      }
    } catch (error) {
      console.error(error);
      setFeedback('Unable to load track details from Spotify.');
      setIsLoading(false);
    }
  }, [token]);

  const applySort = useCallback(async (sortedTracks) => {
    await savePlaylistTracks(token, selectedPlaylist.id, sortedTracks);
  }, [token, selectedPlaylist]);

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
    clearSelection,
  };
}
