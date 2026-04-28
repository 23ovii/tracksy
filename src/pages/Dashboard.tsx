import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useSpotify } from '../hooks/useSpotify.tsx';
import SortProgress from '../components/SortProgress.tsx';
import { SORT_OPTIONS, sortTracks } from '../utils/playlistUtils.ts';
import type { Playlist } from '../types';
import AmbientBackdrop from '../components/dashboard/AmbientBackdrop';
import LibraryPanel from '../components/dashboard/LibraryPanel';
import SorterHeader from '../components/dashboard/SorterHeader';
import SortChips from '../components/dashboard/SortChips';
import TrackTable from '../components/dashboard/TrackTable';

const GLASS: CSSProperties = {
  background: 'rgba(14, 19, 28, 0.88)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 20,
  boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 30px 60px -24px rgba(0,0,0,0.7)',
};

function Dashboard() {
  const { playlists, tracks, selectedPlaylist, isLoading, loadPlaylists, loadPlaylistTracks, applySort, cancelSort, clearSelection } = useSpotify();

  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [sortFeedback, setSortFeedback] = useState('');
  const [sortKey, setSortKey] = useState(0);
  const [applyProgress, setApplyProgress] = useState(0);
  const [rateLimitMsg, setRateLimitMsg] = useState('');
  const apiPromiseRef = useRef<Promise<{ moves: number }> | null>(null);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const sorted = useMemo(() => sortTracks(tracks, sortBy, sortDir), [tracks, sortBy, sortDir]);
  const totalMs = useMemo(() => tracks.reduce((s, t) => s + t.durationMs, 0), [tracks]);

  function pickSort(id: string) {
    if (sortBy === id) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(id); setSortDir('asc'); }
    setApplied(false);
    setSortFeedback('');
    setSortKey((k) => k + 1);
  }

  function handleBack() {
    if (applying) cancelSort();
    clearSelection();
    setApplied(false);
    setSortFeedback('');
  }

  function handleSelect(playlist: Playlist) {
    loadPlaylistTracks(playlist);
    setApplied(false);
    setSortFeedback('');
    setSortKey((k) => k + 1);
  }

  function handleApply() {
    setApplying(true);
    setApplyProgress(0);
    setRateLimitMsg('');
    setSortFeedback('');
    const promise = applySort(
      sorted,
      setApplyProgress,
      (retryAfter) => setRateLimitMsg(`Rate limited by Spotify — retrying in ${retryAfter}s…`),
    );
    apiPromiseRef.current = promise;
    promise.catch((err) => {
      setApplying(false);
      setApplyProgress(0);
      setRateLimitMsg('');
      if (err?.name !== 'AbortError') setSortFeedback('Failed to save to Spotify. Try again.');
    });
  }

  async function handleDone() {
    const playlistName = selectedPlaylist?.name;
    try {
      const result = await apiPromiseRef.current;
      setApplying(false);
      setApplyProgress(0);
      setRateLimitMsg('');
      const label = SORT_OPTIONS.find((o) => o.id === sortBy)?.label;
      if (result?.moves === 0) {
        setSortFeedback(`"${playlistName}" is already in this order.`);
      } else {
        setApplied(true);
        if (playlistName) setSortFeedback(`"${playlistName}" sorted by ${label} and saved.`);
      }
    } catch {
      setApplying(false);
      setSortFeedback('Failed to save to Spotify. Try again.');
    }
  }

  const accent = selectedPlaylist?.color1 ?? 'var(--green)';
  const accent2 = selectedPlaylist?.color2 ?? '#5af5a0';

  return (
    <>
      <AmbientBackdrop playlist={selectedPlaylist} />

      <div style={{
        maxWidth: 1180, margin: '0 auto', padding: '32px 28px 80px',
        animation: 'fadeUp 0.45s var(--ease-out)',
        position: 'relative', zIndex: 1,
      }}>

        {!selectedPlaylist && (
          <LibraryPanel
            playlists={playlists}
            isLoading={isLoading}
            onRefresh={loadPlaylists}
            onSelect={handleSelect}
          />
        )}

        {selectedPlaylist ? (
          <div style={{ ...GLASS, overflow: 'hidden' }}>
            <SorterHeader
              selectedPlaylist={selectedPlaylist}
              totalMs={totalMs}
              applying={applying}
              applied={applied}
              accent={accent}
              accent2={accent2}
              onBack={handleBack}
              onApply={handleApply}
            />

            <SortChips sortBy={sortBy} sortDir={sortDir} onPick={pickSort} />

            <SortProgress
              active={applying}
              progress={applyProgress}
              label={SORT_OPTIONS.find((o) => o.id === sortBy)?.label}
              onDone={handleDone}
              color={accent}
              colorEnd={accent2}
              rateLimitMsg={rateLimitMsg}
            />

            {sortFeedback && !applying && (
              <div style={{
                padding: '12px 24px',
                background: `${accent}10`,
                borderBottom: `1px solid ${accent}22`,
                fontSize: 13, color: accent, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 8,
                animation: 'fadeIn 0.3s var(--ease-out)',
              }}>
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>
                  {sortFeedback}
                  {selectedPlaylist && (
                    <>
                      {' — '}
                      <a
                        href={`https://open.spotify.com/playlist/${selectedPlaylist.id}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: accent, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}
                      >
                        Open in Spotify
                      </a>
                    </>
                  )}
                </span>
              </div>
            )}

            <TrackTable
              sorted={sorted}
              sortBy={sortBy}
              sortKey={sortKey}
              isLoading={isLoading}
              accent={accent}
            />
          </div>
        ) : null}
      </div>
    </>
  );
}

export default Dashboard;
