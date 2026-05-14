import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/pages/Dashboard.tsx', 'utf8');
const nl = '\r\n';
const t = (s) => s.split('\n').join(nl);

// 1. Replace the god-hook setup
c = c.replace(
  t(`function Dashboard() {
  const spotify = useSpotify();
  const { playlists, tracks, currentOrder, selectedPlaylist, isLoading, loadPlaylists, loadPlaylistTracks, cancelSort, clearSelection } = spotify;

  const sortApply = useSortApply({
    applySort: spotify.applySort,
    undoLastSort: spotify.undoLastSort,
    restoreOrder: spotify.restoreOrder,
    cancelSort,
  });
  const { applying, isUndo, applyProgress, rateLimitMsg, startApply, startUndo, startRestore, settle, cancel } = sortApply;`),
  t(`function Dashboard() {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const playlistsQuery = usePlaylists();
  const tracksQuery = usePlaylistTracks(selectedPlaylist?.id ?? null);
  const reorder = useReorderPlaylist(selectedPlaylist?.id ?? '');

  const tracks = useMemo(() => tracksQuery.data ?? [], [tracksQuery.data]);
  const playlists = useMemo(() => playlistsQuery.data ?? [], [playlistsQuery.data]);`)
);

// 2. Remove the loadPlaylists effect + add new state vars
c = c.replace(
  t(`  useEffect(() => { loadPlaylists(); }, [loadPlaylists]);

  const prevPlaylistCountRef = useRef(0);`),
  t(`  const [applying, setApplying] = useState(false);
  const [isUndo, setIsUndo] = useState(false);
  const [applyProgress, setApplyProgress] = useState(0);
  const [rateLimitMsg, setRateLimitMsg] = useState('');

  const mutationPromiseRef = useRef<Promise<{ moves: number }> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isUndoRef = useRef(false);
  const isRestoreRef = useRef(false);
  const preApplyIdsRef = useRef<string[]>([]);
  const preApplyKeysRef = useRef<string[]>([]);

  const [lastApplied, setLastApplied] = useState<{ previous: Track[]; sorted: Track[] } | null>(null);

  const prevPlaylistCountRef = useRef(0);`)
);

// 3. Fix sorted useMemo
c = c.replace(
  t(`  const sorted = useMemo(
    () => sortTracks(currentOrder.length ? currentOrder : tracks, sortBy, sortDir),
    [currentOrder, tracks, sortBy, sortDir],
  );`),
  `  const sorted = useMemo(() => sortTracks(tracks, sortBy, sortDir), [tracks, sortBy, sortDir]);`
);

// 4. Fix diffMap useMemo
c = c.replace(
  t(`  const diffMap = useMemo(() => {
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
  }, [currentOrder, tracks, sorted]);`),
  t(`  const diffMap = useMemo(() => {
    if (!tracks.length || !sorted.length) return new Map<Track, number>();
    const originalPos = new Map<Track, number>();
    tracks.forEach((t, i) => originalPos.set(t, i));
    const map = new Map<Track, number>();
    sorted.forEach((t, to) => {
      const from = originalPos.get(t) ?? to;
      map.set(t, from - to);
    });
    return map;
  }, [tracks, sorted]);`)
);

// 5. Fix handleBack
c = c.replace(
  t(`  function handleBack() {
    if (applying) {
      cancel();
      showToast('Sort canceled', 'cancel');
      return;
    }
    clearSelection();
    setApplied(false);
    setSortFeedback('');
    setUndoUntil(null);
  }`),
  t(`  function handleBack() {
    if (applying) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      showToast('Sort canceled', 'cancel');
      return;
    }
    setSelectedPlaylist(null);
    reorder.reset();
    setApplied(false);
    setSortFeedback('');
    setUndoUntil(null);
    setLastApplied(null);
  }`)
);

// 6. Fix handleSelect
c = c.replace(
  t(`  function handleSelect(playlist: Playlist) {
    trackEvent(TrackEvents.PLAYLIST_SELECTED, { trackCount: playlist.trackCount });
    loadPlaylistTracks(playlist);
    setApplied(false);
    setSortFeedback('');
    setSortKey((k) => k + 1);
    setUndoUntil(null);
  }`),
  t(`  function handleSelect(playlist: Playlist) {
    trackEvent(TrackEvents.PLAYLIST_SELECTED, { trackCount: playlist.trackCount });
    setSelectedPlaylist(playlist);
    reorder.reset();
    setApplied(false);
    setSortFeedback('');
    setSortKey((k) => k + 1);
    setUndoUntil(null);
    setLastApplied(null);
  }`)
);

// 7. Replace handleApply with startReorder + new handleApply
c = c.replace(
  t(`  function handleApply() {
    startApply(sorted, currentOrder.length ? currentOrder : tracks, (err: unknown) => {
      if ((err as { name?: string })?.name !== 'AbortError') setSortFeedback('Failed to save to Spotify. Try again.');
    });
  }`),
  t(`  function startReorder(previous: Track[], target: Track[], opts: { undo?: boolean; restore?: boolean } = {}) {
    setApplying(true);
    setIsUndo(Boolean(opts.undo));
    setApplyProgress(0);
    setRateLimitMsg('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const promise = reorder.mutateAsync({
      previous,
      sorted: target,
      abortSignal: controller.signal,
      onProgress: setApplyProgress,
      onRateLimit: (r) => setRateLimitMsg(\`Rate limited by Spotify — retrying in \${r}s…\`),
    });
    mutationPromiseRef.current = promise;

    promise.catch((err) => {
      if ((err as { name?: string })?.name !== 'AbortError') {
        setSortFeedback('Failed to save to Spotify. Try again.');
      }
      setApplying(false);
      setApplyProgress(0);
      setRateLimitMsg('');
    });
  }

  function handleApply() {
    const currentTracks = tracksQuery.data ?? [];
    isUndoRef.current = false;
    isRestoreRef.current = false;
    preApplyIdsRef.current = currentTracks.map((t) => t.id);
    preApplyKeysRef.current = buildTrackOccurrenceKeys(currentTracks);
    setLastApplied({ previous: currentTracks, sorted });
    startReorder(currentTracks, sorted);
  }`)
);

// 8. Fix handleDone
const oldHandleDone = t(`  async function handleDone() {
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
          setSortFeedback(\`"\${playlistName}" is already in this order.\`);
        } else {
          setApplied(true);
          trackEvent(TrackEvents.SORT_APPLIED, { sortBy, moves, trackCount: sorted.length });
          if (playlistName) setSortFeedback(\`"\${playlistName}" sorted by \${label} and saved.\`);
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
  }`);

const newHandleDone = t(`  async function handleDone() {
    const wasUndo = isUndoRef.current;
    const wasRestore = isRestoreRef.current;
    const preApplyIds = [...preApplyIdsRef.current];
    const preApplyKeys = [...preApplyKeysRef.current];
    isUndoRef.current = false;
    isRestoreRef.current = false;

    setApplying(false);
    setApplyProgress(0);
    setRateLimitMsg('');

    const playlistName = selectedPlaylist?.name;

    try {
      const result = await mutationPromiseRef.current!;
      const { moves } = result;

      if (wasUndo || wasRestore) {
        setUndoUntil(null);
        setApplied(false);
        setSortFeedback(moves === 0 ? 'Already in this order.' : 'Reverted.');
        setTimeout(() => setSortFeedback(''), 3_000);
      } else {
        const label = SORT_OPTIONS.find((o) => o.id === sortBy)?.label;
        if (moves === 0) {
          setSortFeedback(\`"\${playlistName}" is already in this order.\`);
        } else {
          setApplied(true);
          trackEvent(TrackEvents.SORT_APPLIED, { sortBy, moves, trackCount: sorted.length });
          if (playlistName) setSortFeedback(\`"\${playlistName}" sorted by \${label} and saved.\`);
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
  }`);

c = c.replace(oldHandleDone, newHandleDone);

// 9. Fix handleUndo
c = c.replace(
  t(`  const handleUndo = useCallback(() => {
    trackEvent(TrackEvents.SORT_UNDONE);
    setUndoUntil(null);
    startUndo((err: unknown) => {
      if ((err as { name?: string })?.name !== 'AbortError') setSortFeedback('Failed to undo. Try again.');
    });
  }, [startUndo]);`),
  t(`  const handleUndo = useCallback(() => {
    if (!lastApplied) return;
    trackEvent(TrackEvents.SORT_UNDONE);
    setUndoUntil(null);
    isUndoRef.current = true;
    isRestoreRef.current = false;
    preApplyIdsRef.current = [];
    preApplyKeysRef.current = [];
    startReorder(lastApplied.sorted, lastApplied.previous, { undo: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastApplied]);`)
);

// 10. Fix handleRestore
c = c.replace(
  t(`  const handleRestore = useCallback((entry: HistoryEntry) => {
    setUndoUntil(null);
    startRestore(entry, (err: unknown) => {
      const e = err as { name?: string; message?: string };
      if (e?.name !== 'AbortError') setSortFeedback(e?.message ?? 'Failed to restore. Try again.');
    });
  }, [startRestore]);`),
  t(`  const handleRestore = useCallback((entry: HistoryEntry) => {
    const currentTracks = tracksQuery.data ?? [];
    const restoredTracks = restoreTracksFromKeys(
      currentTracks,
      entry.trackKeysBefore ?? entry.trackIdsBefore,
    );
    if (!restoredTracks) {
      setSortFeedback('This playlist changed since that history entry was saved. Reload the playlist before restoring.');
      return;
    }
    setUndoUntil(null);
    isUndoRef.current = false;
    isRestoreRef.current = true;
    preApplyIdsRef.current = [];
    preApplyKeysRef.current = [];
    startReorder(currentTracks, restoredTracks, { restore: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracksQuery.data]);`)
);

// 11. Add isLoading before return
c = c.replace(
  t(`  const accent = selectedPlaylist?.color1 ?? 'var(--green)';
  const accent2 = selectedPlaylist?.color2 ?? '#5af5a0';

  return (`),
  t(`  const accent = selectedPlaylist?.color1 ?? 'var(--green)';
  const accent2 = selectedPlaylist?.color2 ?? '#5af5a0';

  const isLoading = selectedPlaylist ? tracksQuery.isLoading : playlistsQuery.isLoading;

  return (`)
);

// 12. Fix onRefresh prop in JSX
c = c.replace(
  '            onRefresh={loadPlaylists}',
  '            onRefresh={() => playlistsQuery.refetch()}'
);

writeFileSync('src/pages/Dashboard.tsx', c);

const stillOld = ['useSpotify', 'useSortApply', 'loadPlaylists', 'clearSelection', 'currentOrder', 'startUndo(', 'startRestore(', 'settle()', 'cancel()'];
const remaining = stillOld.filter(s => c.includes(s));
console.log('remaining old refs:', remaining.length ? remaining : 'NONE - clean!');
