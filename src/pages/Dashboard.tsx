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
import PresetsRow from '../components/dashboard/PresetsRow';
import TrackTable from '../components/dashboard/TrackTable';
import { listPresets, savePreset, deletePreset } from '../services/presets';
import type { SortPreset } from '../services/presets';
import { getHistory, pushHistory, clearHistory } from '../services/sortHistory';
import type { HistoryEntry } from '../services/sortHistory';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useShortcutsOverlay } from '../context/ShortcutsOverlayContext';

const GLASS: CSSProperties = {
  background: 'rgba(14, 19, 28, 0.88)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 20,
  boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 30px 60px -24px rgba(0,0,0,0.7)',
};

function Dashboard() {
  const { playlists, tracks, selectedPlaylist, isLoading, loadPlaylists, loadPlaylistTracks, applySort, undoLastSort, restoreOrder, cancelSort, clearSelection, getCurrentOrder } = useSpotify();

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
  const [presets, setPresets] = useState<SortPreset[]>(() => listPresets());
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);
  const [sortHistory, setSortHistory] = useState<HistoryEntry[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const filterInputRef = useRef<HTMLInputElement>(null);
  const apiPromiseRef = useRef<Promise<{ moves: number }> | null>(null);
  const isUndoRef = useRef(false);
  const isRestoreRef = useRef(false);
  const preApplyTrackIdsRef = useRef<string[]>([]);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { open: overlayOpen, toggle: toggleOverlay } = useShortcutsOverlay();

  function showToast(msg: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, key: Date.now() });
    toastTimerRef.current = setTimeout(() => setToast(null), 2_500);
  }

  function handleSavePreset(name: string) {
    try {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      const preset: SortPreset = { id, name, sortBy, sortDir, createdAt: Date.now() };
      savePreset(preset);
      setPresets(listPresets());
      showToast('Preset saved');
    } catch (err: any) {
      showToast(err?.message ?? 'Could not save preset.');
    }
  }

  function handleDeletePreset(id: string) {
    deletePreset(id);
    setPresets(listPresets());
    showToast('Preset deleted');
  }

  function handleLoadPreset(preset: SortPreset) {
    setSortBy(preset.sortBy);
    setSortDir(preset.sortDir);
    setApplied(false);
    setSortFeedback('');
    setSortKey((k) => k + 1);
  }

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  useEffect(() => {
    if (undoUntil === null) return;
    const id = setInterval(() => {
      const remaining = undoUntil - Date.now();
      if (remaining <= 0) {
        setUndoUntil(null);
      } else {
        setUndoCountdown((remaining / 30_000) * 100);
      }
    }, 50);
    return () => clearInterval(id);
  }, [undoUntil]);

  useEffect(() => {
    setSortHistory(selectedPlaylist ? getHistory(selectedPlaylist.id) : []);
  }, [selectedPlaylist]);

  const [showPreview, setShowPreview] = useState<boolean>(() => {
    try { return localStorage.getItem('tracksy_show_preview') !== 'false'; } catch (_) { return true; }
  });

  function togglePreview() {
    setShowPreview((v) => {
      const next = !v;
      try { localStorage.setItem('tracksy_show_preview', String(next)); } catch (_) { /* ignore */ }
      return next;
    });
  }

  const sorted = useMemo(() => sortTracks(tracks, sortBy, sortDir), [tracks, sortBy, sortDir]);
  const totalMs = useMemo(() => tracks.reduce((s, t) => s + t.durationMs, 0), [tracks]);

  const diffMap = useMemo(() => {
    if (!tracks.length || !sorted.length) return new Map<string, number>();
    const originalPos = new Map<string, number>();
    tracks.forEach((t, i) => originalPos.set(t.id, i));
    const map = new Map<string, number>();
    sorted.forEach((t, to) => {
      const from = originalPos.get(t.id) ?? to;
      map.set(t.id, from - to);
    });
    return map;
  }, [tracks, sorted]);

  const displayed = useMemo(() => {
    if (!filterQuery.trim()) return sorted;
    const q = filterQuery.toLowerCase();
    return sorted.filter((t) => t.name.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
  }, [sorted, filterQuery]);

  function openFilter() {
    setShowFilter(true);
    setTimeout(() => filterInputRef.current?.focus(), 40);
  }

  function closeFilter() {
    setShowFilter(false);
    setFilterQuery('');
  }

  useKeyboardShortcuts(
    {
      ...Object.fromEntries(
        SORT_OPTIONS.map((opt, i) => [String(i + 1), () => { if (selectedPlaylist) pickSort(opt.id); }]),
      ),
      d: () => { if (selectedPlaylist) setSortDir((dir) => { setApplied(false); setSortFeedback(''); setSortKey((k) => k + 1); return dir === 'asc' ? 'desc' : 'asc'; }); },
      enter: () => { if (selectedPlaylist && !applying && !applied) handleApply(); },
      escape: () => { if (showFilter) { closeFilter(); return; } if (selectedPlaylist) handleBack(); },
      '/': () => {
        if (!selectedPlaylist) return;
        if (showFilter) filterInputRef.current?.focus();
        else openFilter();
      },
      '?': toggleOverlay,
    },
    (e: KeyboardEvent) => {
      if (overlayOpen) return true;
      if (e.key === 'Escape' && showFilter) return false;
      const t = e.target as HTMLElement;
      return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
    },
  );

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
    preApplyTrackIdsRef.current = getCurrentOrder().map((t) => t.id);
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
    const wasRestore = isRestoreRef.current;
    isUndoRef.current = false;
    isRestoreRef.current = false;
    try {
      const result = await apiPromiseRef.current;
      setApplying(false);
      setApplyProgress(0);
      setRateLimitMsg('');
      if (wasUndo || wasRestore) {
        setUndoUntil(null);
        setApplied(false);
        if (result?.moves === 0) {
          setSortFeedback('Already in this order.');
        } else {
          setSortFeedback('Reverted.');
        }
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
          if (selectedPlaylist) {
            const entry: HistoryEntry = {
              id: Date.now().toString(36) + Math.random().toString(36).slice(2),
              playlistId: selectedPlaylist.id,
              appliedAt: Date.now(),
              sortLabel: label ?? sortBy,
              trackIdsBefore: preApplyTrackIdsRef.current,
              trackIdsAfter: sorted.map((t) => t.id),
            };
            pushHistory(entry);
            setSortHistory(getHistory(selectedPlaylist.id));
          }
        }
      }
    } catch {
      isUndoRef.current = false;
      isRestoreRef.current = false;
      setApplying(false);
      setSortFeedback(wasUndo || wasRestore ? 'Failed to revert. Try again.' : 'Failed to save to Spotify. Try again.');
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

  const handleRestore = useCallback((entry: HistoryEntry) => {
    setUndoUntil(null);
    setApplying(true);
    setApplyProgress(0);
    setRateLimitMsg('');
    setSortFeedback('');
    isRestoreRef.current = true;
    const promise = restoreOrder(
      entry.trackIdsBefore,
      setApplyProgress,
      (retryAfter) => setRateLimitMsg(`Rate limited by Spotify — retrying in ${retryAfter}s…`),
    );
    apiPromiseRef.current = promise;
    promise.catch((err) => {
      isRestoreRef.current = false;
      setApplying(false);
      setApplyProgress(0);
      setRateLimitMsg('');
      if (err?.name !== 'AbortError') setSortFeedback('Failed to restore. Try again.');
    });
  }, [restoreOrder]);

  function handleClearHistory() {
    if (!selectedPlaylist) return;
    clearHistory(selectedPlaylist.id);
    setSortHistory([]);
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
              historyEntries={sortHistory}
              onBack={handleBack}
              onApply={handleApply}
              onRestore={handleRestore}
              onClearHistory={handleClearHistory}
            />

            <SortChips sortBy={sortBy} sortDir={sortDir} onPick={pickSort} />

            <PresetsRow
              presets={presets}
              onLoad={handleLoadPreset}
              onDelete={handleDeletePreset}
              onSave={handleSavePreset}
            />

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
              sorted={displayed}
              sortBy={sortBy}
              sortKey={sortKey}
              isLoading={isLoading}
              accent={accent}
              diffMap={diffMap}
              showPreview={showPreview}
              onTogglePreview={togglePreview}
              showFilter={showFilter}
              filterQuery={filterQuery}
              filterInputRef={filterInputRef}
              onFilterChange={setFilterQuery}
              onFilterClose={closeFilter}
            />
          </div>
        ) : null}
      </div>
      {undoUntil !== null && !applying && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          zIndex: 100, minWidth: 300, maxWidth: 440,
          background: 'rgba(14, 19, 28, 0.92)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset',
          overflow: 'hidden',
          animation: 'toastIn 0.3s var(--ease-out)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}>
          <div style={{ padding: '12px 10px 12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
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
                padding: '5px 12px',
                background: `${accent}18`,
                border: `1px solid ${accent}44`,
                borderRadius: 7,
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
            <button
              onClick={() => setUndoUntil(null)}
              aria-label="Dismiss"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 24, height: 24, flexShrink: 0,
                background: 'none', border: 'none',
                color: 'var(--text-3)', fontSize: 18, lineHeight: 1,
                cursor: 'pointer', borderRadius: 4,
              }}
            >
              ×
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

      {toast && (
        <div
          key={toast.key}
          style={{
            position: 'fixed', bottom: undoUntil !== null ? 96 : 32,
            left: '50%', transform: 'translateX(-50%)',
            zIndex: 101,
            background: 'rgba(14, 19, 28, 0.92)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            padding: '9px 18px',
            fontSize: 13, color: 'var(--text)', fontWeight: 500,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            animation: 'toastIn 0.25s var(--ease-out)',
            whiteSpace: 'nowrap',
          }}
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}

export default Dashboard;
