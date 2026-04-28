import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
  const { playlists, tracks, selectedPlaylist, isLoading, loadPlaylists, loadPlaylistTracks, applySort, undoLastSort, cancelSort, clearSelection } = useSpotify();

  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [sortFeedback, setSortFeedback] = useState('');
  const [sortKey, setSortKey] = useState(0);
  const [applyProgress, setApplyProgress] = useState(0);
  const [rateLimitMsg, setRateLimitMsg] = useState('');
  const [undoUntil, setUndoUntil] = useState<number | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(100);
  const apiPromiseRef = useRef<Promise<{ moves: number }> | null>(null);
  const isUndoRef = useRef(false);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  useEffect(() => {
    if (undoUntil === null) return;
    let raf: number;
    function tick() {
      const remaining = undoUntil! - Date.now();
      if (remaining <= 0) {
        setUndoUntil(null);
        return;
      }
      setUndoCountdown((remaining / 30_000) * 100);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [undoUntil]);

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
    setUndoUntil(null);
  }

  function handleSelect(playlist: Playlist) {
    loadPlaylistTracks(playlist);
    setApplied(false);
    setSortFeedback('');
    setSortKey((k) => k + 1);
    setUndoUntil(null);
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
    const wasUndo = isUndoRef.current;
    isUndoRef.current = false;
    try {
      const result = await apiPromiseRef.current;
      setApplying(false);
      setApplyProgress(0);
      setRateLimitMsg('');
      if (wasUndo) {
        setUndoUntil(null);
        setApplied(false);
        setSortFeedback('Reverted.');
        setTimeout(() => setSortFeedback(''), 3_000);
      } else {
        const label = SORT_OPTIONS.find((o) => o.id === sortBy)?.label;
        if (result?.moves === 0) {
          setSortFeedback(`"${playlistName}" is already in this order.`);
        } else {
          setApplied(true);
          if (playlistName) setSortFeedback(`"${playlistName}" sorted by ${label} and saved.`);
          setUndoUntil(Date.now() + 30_000);
          setUndoCountdown(100);
        }
      }
    } catch {
      isUndoRef.current = false;
      setApplying(false);
      setSortFeedback(wasUndo ? 'Failed to undo. Try again.' : 'Failed to save to Spotify. Try again.');
    }
  }

  const handleUndo = useCallback(() => {
    setUndoUntil(null);
    setApplying(true);
    setApplyProgress(0);
    setRateLimitMsg('');
    setSortFeedback('');
    isUndoRef.current = true;
    const promise = undoLastSort(
      setApplyProgress,
      (retryAfter) => setRateLimitMsg(`Rate limited by Spotify — retrying in ${retryAfter}s…`),
    );
    apiPromiseRef.current = promise;
    promise.catch((err) => {
      isUndoRef.current = false;
      setApplying(false);
      setApplyProgress(0);
      setRateLimitMsg('');
      if (err?.name !== 'AbortError') setSortFeedback('Failed to undo. Try again.');
    });
  }, [undoLastSort]);

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
              label={isUndoRef.current ? 'original order' : SORT_OPTIONS.find((o) => o.id === sortBy)?.label}
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
      {undoUntil !== null && !applying && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          zIndex: 100, minWidth: 320, maxWidth: 480,
          background: 'rgba(14, 19, 28, 0.88)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset',
          overflow: 'hidden',
          animation: 'fadeUp 0.3s var(--ease-out)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
              Sorted by{' '}
              <strong style={{ color: accent }}>
                {SORT_OPTIONS.find((o) => o.id === sortBy)?.label}
              </strong>
              . Undo?
            </span>
            <button
              onClick={handleUndo}
              style={{
                padding: '6px 14px',
                background: `${accent}18`,
                border: `1px solid ${accent}44`,
                borderRadius: 8,
                color: accent,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
                letterSpacing: '-0.1px',
              }}
            >
              Undo
            </button>
          </div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
            <div style={{
              height: '100%',
              width: `${undoCountdown}%`,
              background: `linear-gradient(90deg, ${accent}, ${accent2})`,
              transition: 'width 0.1s linear',
            }} />
          </div>
        </div>
      )}
    </>
  );
}

export default Dashboard;
