import { useEffect, useMemo, useRef, useState } from 'react';

import { usePlaylists, usePlaylistTracks } from '../api/playlists';
import { useReorderPlaylist } from '../api/mutations';
import SortProgress from '../components/SortProgress.tsx';
import Toast from '../components/Toast.tsx';
import UndoToast from '../components/dashboard/UndoToast.tsx';
import { SORT_OPTIONS, sortCriteriaLabel, sortTracks } from '../utils/playlistUtils.ts';
import type { SortCriterion, SortKey } from '../utils/playlistUtils.ts';
import type { Playlist, Track } from '../types';
import AmbientBackdrop from '../components/dashboard/AmbientBackdrop';
import LibraryPanel from '../components/dashboard/LibraryPanel';
import SorterHeader from '../components/dashboard/SorterHeader';
import SortCriteriaEditor from '../components/dashboard/SortCriteriaEditor';
import PresetsRow from '../components/dashboard/PresetsRow';
import TrackTable from '../components/dashboard/TrackTable';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useReorderOperation } from '../hooks/useReorderOperation';
import { useDashboardPresetsHistory } from '../hooks/useDashboardPresetsHistory';
import { useShortcutsOverlay } from '../context/ShortcutsOverlayContext';
import { buildTrackOccurrenceKeys, restoreTracksFromKeys } from '../utils/trackIdentity';
import { trackEvent, TrackEvents } from '../services/analytics';
import { GLASS_SURFACE } from '../styles/tokens.ts';
import { UNDO_WINDOW_MS, TOAST_TIMEOUT_MS, TOAST_TIMEOUT_CANCEL_MS } from '../utils/constants.ts';
import { errorMessage, isAbortError } from '../utils/errors.ts';
import type { HistoryEntry } from '../services/sortHistory';
import type { SortPreset } from '../services/presets';

function reorderFailureMessage(err: unknown) {
  const failure = isAbortError(err) ? 'Sort canceled.' : errorMessage(err, 'Failed to save to Spotify.');
  return `${failure} Spotify may have applied some moves; review the current playlist order before trying again.`;
}

function Dashboard() {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const playlistsQuery = usePlaylists();
  const tracksQuery = usePlaylistTracks(selectedPlaylist?.id ?? null);
  const unsupportedCount = tracksQuery.data?.unsupportedCount ?? 0;
  const reorder = useReorderPlaylist(selectedPlaylist?.id ?? '', unsupportedCount);

  const tracks = useMemo(() => tracksQuery.data?.tracks ?? [], [tracksQuery.data]);
  const playlists = useMemo(() => playlistsQuery.data ?? [], [playlistsQuery.data]);

  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([{ key: 'name', direction: 'asc' }]);
  const primaryCriterion = sortCriteria[0];
  const sortBy = primaryCriterion?.key ?? 'name';
  const [applied, setApplied] = useState(false);
  const [sortFeedback, setSortFeedback] = useState('');
  const [sortFeedbackIsError, setSortFeedbackIsError] = useState(false);
  const [sortKey, setSortKey] = useState(0);
  const [undoUntil, setUndoUntil] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; key: number; type?: 'cancel' } | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const filterInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { open: overlayOpen, toggle: toggleOverlay } = useShortcutsOverlay();
  const {
    presets,
    history: sortHistory,
    saveCurrentPreset,
    removePreset,
    recordHistory,
    removeHistory,
  } = useDashboardPresetsHistory(selectedPlaylist?.id ?? null);

  const operation = useReorderOperation({
    mutateAsync: reorder.mutateAsync,
    onError: (error) => updateSortFeedback(reorderFailureMessage(error), true),
  });
  const { applying, isUndo, applyProgress, rateLimitMsg } = operation;

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  // Previous order stored for undo — captured just before apply
  const [lastApplied, setLastApplied] = useState<{ previous: Track[]; sorted: Track[] } | null>(null);

  function updateSortFeedback(message: string, isError = false) {
    setSortFeedback(message);
    setSortFeedbackIsError(isError);
  }

  function showToast(msg: string, type?: 'cancel') {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(type !== undefined ? { msg, key: Date.now(), type } : { msg, key: Date.now() });
    toastTimerRef.current = setTimeout(() => setToast(null), type === 'cancel' ? TOAST_TIMEOUT_CANCEL_MS : TOAST_TIMEOUT_MS);
  }

  function handleSavePreset(name: string) {
    try {
      saveCurrentPreset(name, sortCriteria);
      trackEvent(TrackEvents.PRESET_SAVED);
      showToast('Preset saved');
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Could not save preset.'));
    }
  }

  function handleDeletePreset(id: string) {
    removePreset(id);
    showToast('Preset deleted');
  }

  function handleLoadPreset(preset: SortPreset) {
    trackEvent(TrackEvents.PRESET_APPLIED);
    setSortCriteria(preset.criteria);
    setApplied(false);
    updateSortFeedback('');
    setSortKey((k) => k + 1);
  }

  const prevPlaylistCountRef = useRef(0);
  useEffect(() => {
    if (playlists.length > 0 && playlists.length !== prevPlaylistCountRef.current) {
      prevPlaylistCountRef.current = playlists.length;
      trackEvent(TrackEvents.PLAYLISTS_LOADED, { count: playlists.length });
    }
  }, [playlists.length]);

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

  const sorted = useMemo(() => sortTracks(tracks, sortCriteria), [tracks, sortCriteria]);
  const totalMs = useMemo(() => tracks.reduce((s, t) => s + t.durationMs, 0), [tracks]);

  // diffMap: shows how far each track in `sorted` has moved from the current Spotify order.
  // tracksQuery.data is the source of truth (cache = current Spotify order after each apply).
  const diffMap = useMemo(() => {
    const baseline = tracks;
    if (!baseline.length || !sorted.length) return new Map<Track, number>();
    const originalPos = new Map<Track, number>();
    baseline.forEach((t, i) => originalPos.set(t, i));
    const map = new Map<Track, number>();
    sorted.forEach((t, to) => {
      const from = originalPos.get(t) ?? to;
      map.set(t, from - to);
    });
    return map;
  }, [tracks, sorted]);

  const displayed = useMemo(() => {
    if (!filterQuery.trim()) return sorted;
    const q = filterQuery.toLowerCase();
    return sorted.filter((t) => t.name.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
  }, [sorted, filterQuery]);

  useEffect(() => {
    if (showFilter) filterInputRef.current?.focus();
  }, [showFilter]);

  function openFilter() {
    setShowFilter(true);
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
          handleCriteriaChange(sortCriteria.map((criterion, index) => index === 0
            ? { ...criterion, direction: criterion.direction === 'asc' ? 'desc' : 'asc' }
            : criterion));
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

  function handleCriteriaChange(criteria: SortCriterion[]) {
    const primary = criteria[0];
    if (!primary) return;
    setSortCriteria(criteria);
    trackEvent(TrackEvents.SORT_PICKED, {
      sortBy: primary.key,
      sortDir: primary.direction,
      sortCriteriaCount: criteria.length,
    });
    setApplied(false);
    updateSortFeedback('');
    setSortKey((k) => k + 1);
  }

  function pickSort(id: SortKey) {
    const currentIndex = sortCriteria.findIndex((criterion) => criterion.key === id);
    if (currentIndex === 0 && id !== 'discography') {
      handleCriteriaChange(sortCriteria.map((criterion, index) => index === 0
        ? { ...criterion, direction: criterion.direction === 'asc' ? 'desc' : 'asc' }
        : criterion));
      return;
    }
    if (currentIndex > 0) {
      const next = [...sortCriteria];
      const [criterion] = next.splice(currentIndex, 1);
      if (!criterion) return;
      next.unshift(criterion);
      handleCriteriaChange(next);
      return;
    }
    handleCriteriaChange([{ key: id, direction: 'asc' }, ...sortCriteria.slice(1)]);
  }

  function handleBack() {
    if (applying) {
      operation.cancel();
      showToast('Sort canceled', 'cancel');
      return;
    }
    setSelectedPlaylist(null);
    reorder.reset();
    setApplied(false);
    updateSortFeedback('');
    setUndoUntil(null);
    setLastApplied(null);
  }

  function handleSelect(playlist: Playlist) {
    trackEvent(TrackEvents.PLAYLIST_SELECTED, { trackCount: playlist.trackCount });
    setSelectedPlaylist(playlist);
    reorder.reset();
    setApplied(false);
    updateSortFeedback('');
    setSortKey((k) => k + 1);
    setUndoUntil(null);
    setLastApplied(null);
  }

  function startReorder(previous: Track[], target: Track[], kind: 'sort' | 'undo' | 'restore') {
    if (!tracksQuery.data || tracksQuery.isLoading || tracksQuery.isFetching || tracksQuery.isError) return;
    if (unsupportedCount > 0) {
      updateSortFeedback('This playlist contains local or unavailable tracks and cannot be safely reordered.', true);
      return;
    }
    if (!selectedPlaylist) return;

    operation.start(previous, target, {
      kind,
      playlistId: selectedPlaylist.id,
      playlistName: selectedPlaylist.name,
      sortBy,
      sortCriteria,
      sortedTracks: target,
      previousTrackKeys: kind === 'sort' ? buildTrackOccurrenceKeys(previous) : [],
    }, true);
  }

  function handleApply() {
    if (!tracksQuery.data || tracksQuery.isFetching || tracksQuery.isError || unsupportedCount > 0) return;
    const currentTracks = tracksQuery.data?.tracks ?? [];
    setLastApplied({ previous: currentTracks, sorted });
    startReorder(currentTracks, sorted, 'sort');
  }

  async function handleDone() {
    const completed = await operation.complete();
    if (!completed) return;
    const { moves, metadata } = completed;

    if (metadata.kind === 'undo' || metadata.kind === 'restore') {
      setUndoUntil(null);
      setApplied(false);
      updateSortFeedback(moves === 0 ? 'Already in this order.' : 'Reverted.');
      setTimeout(() => updateSortFeedback(''), TOAST_TIMEOUT_CANCEL_MS);
    } else {
      const label = sortCriteriaLabel(metadata.sortCriteria);
      if (moves === 0) {
        updateSortFeedback(`"${metadata.playlistName}" is already in this order.`);
      } else {
        setApplied(true);
        trackEvent(TrackEvents.SORT_APPLIED, {
          sortBy: metadata.sortBy,
          sortCriteriaCount: metadata.sortCriteria.length,
          moves,
          trackCount: metadata.sortedTracks.length,
        });
        updateSortFeedback(`"${metadata.playlistName}" sorted by ${label} and saved.`);
        setUndoUntil(Date.now() + UNDO_WINDOW_MS);
        const entry: HistoryEntry = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2),
          playlistId: metadata.playlistId,
          appliedAt: Date.now(),
          sortLabel: label ?? metadata.sortBy,
          trackKeysBefore: metadata.previousTrackKeys,
          trackKeysAfter: buildTrackOccurrenceKeys(metadata.sortedTracks),
        };
        try {
          recordHistory(entry);
        } catch (error: unknown) {
          showToast(`Sort was saved, but its history could not be saved: ${errorMessage(error, 'browser storage unavailable')}`);
        }
      }
    }
  }

  function handleUndo() {
    if (!lastApplied || tracksQuery.isFetching || tracksQuery.isError) return;
    trackEvent(TrackEvents.SORT_UNDONE);
    setUndoUntil(null);
    startReorder(lastApplied.sorted, lastApplied.previous, 'undo');
  }

  function handleRestore(entry: HistoryEntry) {
    const currentTracks = tracksQuery.data?.tracks ?? [];
    const targetKeys = entry.trackKeysBefore ?? entry.trackIdsBefore;
    if (!targetKeys) {
      updateSortFeedback('This history entry cannot be restored. Sort the playlist again to create a new entry.', true);
      return;
    }
    const restoredTracks = restoreTracksFromKeys(
      currentTracks,
      targetKeys,
    );
    if (!restoredTracks) {
      updateSortFeedback('This playlist changed since that history entry was saved. Reload the playlist before restoring.', true);
      return;
    }
    setUndoUntil(null);
    startReorder(currentTracks, restoredTracks, 'restore');
  }

  function handleClearHistory() {
    try {
      removeHistory();
    } catch (error: unknown) {
      showToast(errorMessage(error, 'Could not clear sort history.'));
    }
  }

  const accent = selectedPlaylist?.color1 ?? 'var(--green)';
  const accent2 = selectedPlaylist?.color2 ?? '#5af5a0';

  const isLoading = selectedPlaylist ? tracksQuery.isLoading : playlistsQuery.isLoading;
  const canWrite = Boolean(
    selectedPlaylist && tracksQuery.data && !tracksQuery.isLoading && !tracksQuery.isFetching &&
    !tracksQuery.isError && unsupportedCount === 0,
  );

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
            isFetching={playlistsQuery.isFetching}
            isError={playlistsQuery.isError}
            onRefresh={() => playlistsQuery.refetch()}
            onSelect={handleSelect}
          />
        )}

        {selectedPlaylist && (
          <div style={{ ...GLASS_SURFACE, overflow: 'hidden' }}>
            <SorterHeader
              selectedPlaylist={selectedPlaylist}
              totalMs={totalMs}
              applying={applying}
              applied={applied}
              canWrite={canWrite}
              accent={accent}
              accent2={accent2}
              historyEntries={sortHistory}
              onBack={handleBack}
              onApply={handleApply}
              onRestore={handleRestore}
              onClearHistory={handleClearHistory}
            />

            {unsupportedCount > 0 && (
              <div role="status" style={{
                padding: '12px 24px',
                borderBottom: '1px solid var(--border)',
                background: 'rgba(245,158,11,0.08)',
                color: 'var(--text-2)',
                fontSize: 13,
              }}>
                Sorting is disabled because this playlist contains {unsupportedCount} local or unavailable {unsupportedCount === 1 ? 'track' : 'tracks'}.
              </div>
            )}
            {tracksQuery.isError && (
              <div role="alert" style={{
                padding: '12px 24px',
                borderBottom: '1px solid var(--border)',
                color: 'var(--error-text)',
                fontSize: 13,
              }}>
                Could not load this playlist’s tracks. Go back and select it again before sorting.
              </div>
            )}
            {tracksQuery.isFetching && tracksQuery.data && (
              <div role="status" style={{
                padding: '12px 24px',
                borderBottom: '1px solid var(--border)',
                color: 'var(--text-2)',
                fontSize: 13,
              }}>
                Syncing playlist order with Spotify…
              </div>
            )}

            <SortCriteriaEditor criteria={sortCriteria} onChange={handleCriteriaChange} disabled={applying} />

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
              label={isUndo ? 'original order' : sortCriteriaLabel(sortCriteria)}
              onDone={handleDone}
              color={accent}
              colorEnd={accent2}
              rateLimitMsg={rateLimitMsg}
            />

            {sortFeedback && !applying && (
              <div role={sortFeedbackIsError ? 'alert' : 'status'} style={{
                padding: '12px 24px',
                background: sortFeedbackIsError ? 'rgba(239,68,68,0.08)' : `${accent}10`,
                borderBottom: `1px solid ${sortFeedbackIsError ? 'rgba(239,68,68,0.22)' : `${accent}22`}`,
                fontSize: 13, color: sortFeedbackIsError ? 'var(--error-text)' : accent, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 8,
                animation: 'fadeIn 0.3s var(--ease-out)',
              }}>
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  {sortFeedbackIsError
                    ? <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    : <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
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
                        style={{ color: sortFeedbackIsError ? 'var(--error-text)' : accent, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}
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
              isError={tracksQuery.isError}
              isEmptyPlaylist={tracks.length === 0 && unsupportedCount === 0}
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

      {undoUntil !== null && !applying && !tracksQuery.isFetching && !tracksQuery.isError && (
        <UndoToast
          undoUntil={undoUntil}
          sortLabel={sortCriteriaLabel(sortCriteria)}
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
