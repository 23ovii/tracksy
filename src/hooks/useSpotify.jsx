import { useState, useCallback } from 'react';
import { useAuth } from './useAuth.jsx';
import {
  getMockPlaylistTracks,
  getMockPlaylists,
  getSpotifyPlaylistTracks,
  getSpotifyPlaylists,
} from '../services/spotify.js';
import {
  enhancePlaylistSuggestions,
  removeDuplicateTracks,
  sortTracksByVibe,
} from '../utils/playlistUtils.js';

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
      const data = token ? await getSpotifyPlaylists(token) : await getMockPlaylists();
      setPlaylists(data);
    } catch (error) {
      console.error(error);
      setPlaylists(await getMockPlaylists());
      setFeedback('Unable to load Spotify playlists, showing sample data.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const loadPlaylistTracks = useCallback(
    async (playlist) => {
      setIsLoading(true);
      setFeedback('');

      try {
        const data = token
          ? await getSpotifyPlaylistTracks(token, playlist.id)
          : await getMockPlaylistTracks(playlist.id);
        setSelectedPlaylist(playlist);
        setTracks(data);
      } catch (error) {
        console.error(error);
        setTracks(await getMockPlaylistTracks(playlist.id));
        setSelectedPlaylist(playlist);
        setFeedback('Unable to load track details from Spotify. Showing sample track data.');
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  const cleanDuplicates = useCallback(() => {
    setTracks((current) => removeDuplicateTracks(current));
    setFeedback('Duplicates removed from the current track list.');
  }, []);

  const sortByVibe = useCallback(() => {
    setTracks((current) => sortTracksByVibe(current));
    setFeedback('Tracks sorted by a simple vibe score.');
  }, []);

  const enhanceRecommendations = useCallback(() => {
    const suggestion = enhancePlaylistSuggestions(tracks);
    setFeedback(suggestion.message);
  }, [tracks]);

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
    cleanDuplicates,
    sortByVibe,
    enhanceRecommendations,
    clearSelection,
  };
}
