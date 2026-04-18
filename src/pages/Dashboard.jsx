import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useSpotify } from '../hooks/useSpotify.jsx';
import PlaylistCard from '../components/PlaylistCard.jsx';
import TrackItem from '../components/TrackItem.jsx';
import Button from '../components/Button.jsx';

function Dashboard() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const {
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
  } = useSpotify();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    loadPlaylists();
  }, [isAuthenticated, loadPlaylists, navigate]);

  const trackCountLabel = useMemo(() => {
    if (!selectedPlaylist) return 'Select a playlist to see track details';
    return `${selectedPlaylist.trackCount} tracks ready to review`;
  }, [selectedPlaylist]);

  return (
    <section className="space-y-8 py-10">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="card-surface p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-spotify-green">Dashboard</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Your playlists</h2>
            </div>
            <Button onClick={loadPlaylists} variant="secondary">
              {isLoading ? 'Refreshing…' : 'Refresh playlists'}
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            {playlists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} onOpen={loadPlaylistTracks} />
            ))}
            {!isLoading && playlists.length === 0 && (
              <div className="rounded-3xl border border-slate-700 bg-white/5 p-6 text-sm text-slate-300">
                No playlists available yet. Use the login button on the home page to initialize mock data.
              </div>
            )}
          </div>
        </div>

        <div className="card-surface p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-spotify-green">Playlist details</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{selectedPlaylist ? selectedPlaylist.name : 'No playlist selected'}</h3>
              <p className="mt-1 text-sm text-slate-400">{trackCountLabel}</p>
            </div>
            {selectedPlaylist && (
              <button onClick={clearSelection} className="button-secondary">
                Clear
              </button>
            )}
          </div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button variant="secondary" onClick={cleanDuplicates} disabled={!selectedPlaylist}>
              Clean duplicates
            </Button>
            <Button variant="secondary" onClick={sortByVibe} disabled={!selectedPlaylist}>
              Sort by vibe
            </Button>
            <Button variant="secondary" onClick={enhanceRecommendations} disabled={!selectedPlaylist}>
              Enhance
            </Button>
          </div>
          {feedback && (
            <div className="mb-4 rounded-3xl border border-spotify-green/40 bg-spotify-green/10 p-4 text-sm text-spotify-green">
              {feedback}
            </div>
          )}
          <div className="space-y-4">
            {isLoading && (
              <div className="rounded-3xl border border-slate-700 bg-white/5 p-6 text-slate-300">Loading playlist tracks…</div>
            )}
            {!selectedPlaylist && !isLoading && (
              <div className="rounded-3xl border border-slate-700 bg-white/5 p-6 text-slate-300">
                Pick a playlist on the left to reveal track details and actions.
              </div>
            )}
            {selectedPlaylist && tracks.map((track) => <TrackItem key={track.id} track={track} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
