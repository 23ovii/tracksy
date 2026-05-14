import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { CSSProperties } from 'react';

import { useSpotify } from '../hooks/useSpotify.tsx';
import { useSortApply } from '../hooks/useSortApply.ts';
import SortProgress from '../components/SortProgress.tsx';
import Toast from '../components/Toast.tsx';
import UndoToast from '../components/dashboard/UndoToast.tsx';
import { SORT_OPTIONS, sortTracks } from '../utils/playlistUtils.ts';
import type { SortKey, SortDir } from '../utils/playlistUtils.ts';
import type { Playlist, Track } from '../types';
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
import { buildTrackOccurrenceKeys } from '../utils/trackIdentity';
import { trackEvent, TrackEvents } from '../services/analytics';

const GLASS: CSSProperties = {
  background: 'var(--glass-bg)',
  border: '1px solid var(--border)',
  borderRadius: 20,
  boxShadow: 'var(--shadow-card)',
};

function Dashboard() {
  const spotify = useSpotify();
  const { playlists, tracks, currentOrder, selectedPlaylist, isLoading, loadPlaylists, loadPlaylistTracks, cancelSort, clearSelection } = spotify;

  const sortApply = useSortApply({
    applySort: spotify.applySort,
    undoLastSort: spotify.undoLastSort,
    restoreOrder: spotify.restoreOrder,
    cancelSort,
  });
  const { applying, isUndo, applyProgress, rateLimitMsg, startApply, startUndo, startRestore, settle, cancel } = sortApply;

  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [applied, setApplied] = useState(false);
  const [sortFeedback, setSortFeedback] = useState('');
  const [sortKey, setSortKey] = useState(0);
  const [undoUntil, setUndoUntil] = useState<number | null>(null);
  const [presets, setPresets] = useState<SortPreset[]>(() => listPresets());
  const [toast, setToast] = useState<{ msg: string; key: number; type?: 'cancel' } | null>(null);
  const [sortHistory, setSortHistory] = useState<HistoryEntry[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const filterInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { open: overlayOpen, toggle: toggleOverlay } = useShortcutsOverlay();

  function showToast(msg: string, type?: 'cancel') {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(type !== undefined ? { msg, key: Date.now(), type } : { msg, key: Date.now() });
    toastTimerRef.current = setTimeout(() => setToast(null), type === 'cancel' ? 3_000 : 2_500);
  }

  function handleSavePreset(name: string) {
    try {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      const preset: SortPreset = { id, name, sortBy, sortDir, createdAt: Date.now() };
      savePreset(preset);
      setPresets(listPresets());
      trackEvent(TrackEvents.PRESET_SAVED);
      showToast('Preset saved');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Could not save preset.');
    }
  }

  function handleDeletePreset(id: string) {
    deletePreset(id);
    setPresets(listPresets());
    showToast('Preset deleted');
  }

  function handleLoadPreset(preset: SortPreset) {
    trackEvent(TrackEvents.PRESET_APPLIED);
    setSortBy(preset.sortBy);
    setSortDir(preset.sortDir);
    setApplied(false);
    setSortFeedback('');
    setSortKey((k) => k + 1);
  }

  useEffect(() => { loadPlaylists(); }, [loadPlaylists]);

  const prevPlaylistCountRef = useRef(0);
  useEffect(() => {
    if (playlists.length > 0 && playlists.length !== prevPlaylistCountRef.current) {
      prevPlaylistCountRef.current = playlists.length;
      trackEvent(TrackEvents.PLAYLISTS_LOADED, { count: playlists.length });
    }
  }, [playlists.length]);

  useEffect(() => {
    setSortHistory(selectedPlaylist ? getHistory(selectedPlaylist.id) : []);
  }, [selectedPlaylist]);

  const [showPreview, setShowPreview] = useState<boolean>(() => {
    try { return localStorage.getItem('tracksy_show_preview') !== 'false'; } catch { return true; }
  });

  function togglePreview() {
    setShowPreview((v) => {
      const next = !v;
      try { localStorage.setItem('tracksy_show_preview', String(next)); } catch { /* ignore */ }
      return next;
    });
  }

  const sorted = useMemo(() => sortTracks(tracks, sortBy, sortDir), [tracks, sortBy, sortDir]);
  const totalMs = useMemo(() => tracks.reduce((s, t) => s + t.durationMs, 0), [tracks]);

  const diffMap = useMemo(() => {
    const baseline = currentOrder.length ? currentOrder : tracks;
    if (!baseline.length || !sorted.length) return new Map<Track, number>();
    const originalPos = new Map<Track, number>();
    baseline.forEach((t, i) => originalPos.set(t, i));
    const map = new Map<Track, number>();
    sorted.forEach((t, to) => {
      const from = originalPos.get(t) ?? to;
      map.set(t, from - to);
    });
    return map;
  }, [currentOrder, tracks, sorted]);

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
    if (filterQuery.trim()) {
      trackEvent(TrackEvents.FILTER_APPLIED, { filterCount: displayed.length });
    }
    setShowFilter(false);
    setFilterQuery('');
  }

  useKeyboardShortcuts(
    {
      ...Object.fromEntries(
        SORT_OPTIONS.map((opt, i) => [String(i + 1), () => {
          if (selectedPlaylist) { trackEvent(TrackEvents.SHORTCUT_USED, { key: String(i + 1) }); pickSort(opt.id); }
        }]),
      ),
      d: () => {
        if (selectedPlaylist && sortBy !== 'discography') {
          trackEvent(TrackEvents.SHORTCUT_USED, { key: 'd' });
          setSortDir((dir) => { setApplied(false); setSortFeedback(''); setSortKey((k) => k + 1); return dir === 'asc' ? 'desc' : 'asc'; });
        }
      },
      enter: () => {
        if (selectedPlaylist && !applying && !applied) {
          trackEvent(TrackEvents.SHORTCUT_USED, { key: 'enter' });
          handleApply();
        }
      },
      escape: () => {
        if (showFilter) { trackEvent(TrackEvents.SHORTCUT_USED, { key: 'escape' }); closeFilter(); return; }
        if (selectedPlaylist) { trackEvent(TrackEvents.SHORTCUT_USED, { key: 'escape' }); handleBack(); }
      },
      '/': () => {
        if (!selectedPlaylist) return;
        trackEvent(TrackEvents.SHORTCUT_USED, { key: '/' });
        if (showFilter) filterInputRef.current?.focus();
        else openFilter();
      },
      '?': () => { trackEvent(TrackEvents.SHORTCUT_USED, { key: '?' }); toggleOverlay(); },
    },
    (e: KeyboardEvent) => {
      if (overlayOpen) return true;
      if (e.key === 'Escape' && showFilter) return false;
      const t = e.target as HTMLElement;
      return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
    },
  );

  function pickSort(id: SortKey) {
    const toggling = sortBy === id && id !== 'discography';
    const nextDir = toggling && sortDir === 'asc' ? 'desc' : 'asc';
    if (toggling) {
      setSortDir(nextDir);
    } else {
      setSortBy(id);
      setSortDir('asc');
    }
    trackEvent(TrackEvents.SORT_PICKED, { sortBy: id, sortDir: nextDir });
    setApplied(false);
    setSortFeedback('');
    setSortKey((k) => k + 1);
  }

  function handleBack() {
    if (applying) {
      cancel();
      showToast('Sort canceled', 'cancel');
      return;
    }
    clearSelection();
    setApplied(false);
    setSortFeedback('');
    setUndoUntil(null);
  }

  function handleSelect(playlist: Playlist) {
    trackEvent(TrackEvents.PLAYLIST_SELECTED, { trackCount: playlist.trackCount });
    loadPlaylistTracks(playlist);
    setApplied(false);
    setSortFeedback('');
    setSortKey((k) => k + 1);
    setUndoUntil(null);
  }

  function handleApply() {
    startApply(sorted, currentOrder.length ? currentOrder : tracks, (err: unknown) => {
      if ((err as { name?: string })?.name !== 'AbortError') setSortFeedback('Failed to save to Spotify. Try again.');
    });
  }

  async function handleDone() {
    const playlistName = selectedPlaylist?.name;
    try {
      const { moves, wasUndo, wasRestore, preApplyIds, preApplyKeys } = await settle();
      if (wasUndo || wasRestore) {
        setUndoUntil(null);
        setApplied(false);
        setSortFeedback(moves === 0 ? 'Already in this order.' : 'Reverted.');
        setTimeout(() => setSortFeedback(''), 3_000);
      } else {
        const label = SORT_OPTIONS.find((o) => o.id === sortBy)?.label;
        if (moves === 0) {
          setSortFeedback(`"${playlistName}" is already in this order.`);
        } else {
          setApplied(true);
          trackEvent(TrackEvents.SORT_APPLIED, { sortBy, moves, trackCount: sorted.length });
          if (playlistName) setSortFeedback(`"${playlistName}" sorted by ${label} and saved.`);
          setUndoUntil(Date.now() + 30_000);
          if (selectedPlaylist) {
            const entry: HistoryEntry = {
              id: Date.now().toString(36) + Math.random().toString(36).slice(2),
              playlistId: selectedPlaylist.id,
              appliedAt: Date.now(),
              sortLabel: label ?? sortBy,
              trackIdsBefore: preApplyIds,
              trackIdsAfter: sorted.map((t) => t.id),
              trackKeysBefore: preApplyKeys,
              trackKeysAfter: buildTrackOccurrenceKeys(sorted),
            };
            pushHistory(entry);
            setSortHistory(getHistory(selectedPlaylist.id));
          }
        }
      }
    } catch (err: unknown) {
      setSortFeedback(err instanceof Error ? err.message : 'Failed to save to Spotify. Try again.');
    }
  }

  const handleUndo = useCallback(() => {
    trackEvent(TrackEvents.SORT_UNDONE);
    setUndoUntil(null);
    startUndo((err: unknown) => {
      if ((err as { name?: string })?.name !== 'AbortError') setSortFeedback('Failed to undo. Try again.');
    });
  }, [startUndo]);

  const handleRestore = useCallback((entry: HistoryEntry) => {
    setUndoUntil(null);
    startRestore(entry, (err: unknown) => {
      const e = err as { name?: string; message?: string };
      if (e?.name !== 'AbortError') setSortFeedback(e?.message ?? 'Failed to restore. Try again.');
    });
  }, [startRestore]);

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

        {selectedPlaylist && (
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

            <SortChips sortBy={sortBy} sortDir={sortDir} onPick={pickSort} disabled={applying} />

            <PresetsRow
              presets={presets}
              onLoad={handleLoadPreset}
              onDelete={handleDeletePreset}
              onSave={handleSavePreset}
              disabled={applying}
            />

            <SortProgress
              active={applying}
              progress={applyProgress}
              label={isUndo ? 'original order' : SORT_OPTIONS.find((o) => o.id === sortBy)?.label}
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
        )}
      </div>

      {undoUntil !== null && !applying && (
        <UndoToast
          undoUntil={undoUntil}
          sortBy={sortBy}
          accent={accent}
          accent2={accent2}
          onUndo={handleUndo}
          onDismiss={() => setUndoUntil(null)}
        />
      )}

      {toast && (
        <Toast
          key={toast.key}
          msg={toast.msg}
          {...(toast.type !== undefined ? { type: toast.type } : {})}
          stacked={undoUntil !== null}
        />
      )}
    </>
  );
}

export default Dashboard;
