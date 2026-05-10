import { useState, useRef, useCallback } from 'react';

import type { Track } from '../types';
import type { HistoryEntry } from '../services/sortHistory';
import { buildTrackOccurrenceKeys } from '../utils/trackIdentity';

interface SortApplyDeps {
  applySort: (
    sortedTracks: Track[],
    onProgress?: (pct: number) => void,
    onRateLimit?: (retryAfterSeconds: number) => void,
  ) => Promise<{ moves: number }>;
  undoLastSort: (
    onProgress?: (pct: number) => void,
    onRateLimit?: (retryAfterSeconds: number) => void,
  ) => Promise<{ moves: number }>;
  restoreOrder: (
    targetKeys: string[],
    onProgress?: (pct: number) => void,
    onRateLimit?: (retryAfterSeconds: number) => void,
  ) => Promise<{ moves: number }>;
  cancelSort: () => void;
}

export interface SettleResult {
  moves: number;
  wasUndo: boolean;
  wasRestore: boolean;
  preApplyIds: string[];
  preApplyKeys: string[];
}

export function useSortApply({ applySort, undoLastSort, restoreOrder, cancelSort }: SortApplyDeps) {
  const [applying, setApplying] = useState(false);
  const [isUndo, setIsUndo] = useState(false);
  const [applyProgress, setApplyProgress] = useState(0);
  const [rateLimitMsg, setRateLimitMsg] = useState('');

  const apiPromiseRef = useRef<Promise<{ moves: number }> | null>(null);
  const isUndoRef = useRef(false);
  const isRestoreRef = useRef(false);
  const preApplyIdsRef = useRef<string[]>([]);
  const preApplyKeysRef = useRef<string[]>([]);

  function clearProgress() {
    setApplying(false);
    setApplyProgress(0);
    setRateLimitMsg('');
  }

  const onRateLimit = useCallback(
    (r: number) => setRateLimitMsg(`Rate limited by Spotify — retrying in ${r}s…`),
    [],
  );

  const startApply = useCallback((
    sortedTracks: Track[],
    currentOrder: Track[],
    onError: (err: unknown) => void,
  ) => {
    preApplyIdsRef.current = currentOrder.map((t) => t.id);
    preApplyKeysRef.current = buildTrackOccurrenceKeys(currentOrder);
    isUndoRef.current = false;
    isRestoreRef.current = false;
    setApplying(true);
    setIsUndo(false);
    setApplyProgress(0);
    setRateLimitMsg('');
    const promise = applySort(sortedTracks, setApplyProgress, onRateLimit);
    apiPromiseRef.current = promise;
    promise.catch((err) => { clearProgress(); onError(err); });
  }, [applySort, onRateLimit]);

  const startUndo = useCallback((onError: (err: unknown) => void) => {
    isUndoRef.current = true;
    isRestoreRef.current = false;
    setApplying(true);
    setIsUndo(true);
    setApplyProgress(0);
    setRateLimitMsg('');
    const promise = undoLastSort(setApplyProgress, onRateLimit);
    apiPromiseRef.current = promise;
    promise.catch((err) => { isUndoRef.current = false; clearProgress(); onError(err); });
  }, [undoLastSort, onRateLimit]);

  const startRestore = useCallback((
    entry: HistoryEntry,
    onError: (err: unknown) => void,
  ) => {
    isUndoRef.current = false;
    isRestoreRef.current = true;
    setApplying(true);
    setApplyProgress(0);
    setRateLimitMsg('');
    const promise = restoreOrder(
      entry.trackKeysBefore ?? entry.trackIdsBefore,
      setApplyProgress,
      onRateLimit,
    );
    apiPromiseRef.current = promise;
    promise.catch((err) => { isRestoreRef.current = false; clearProgress(); onError(err); });
  }, [restoreOrder, onRateLimit]);

  const settle = useCallback(async (): Promise<SettleResult> => {
    const wasUndo = isUndoRef.current;
    const wasRestore = isRestoreRef.current;
    const preApplyIds = [...preApplyIdsRef.current];
    const preApplyKeys = [...preApplyKeysRef.current];
    isUndoRef.current = false;
    isRestoreRef.current = false;
    try {
      const result = await apiPromiseRef.current!;
      clearProgress();
      return { moves: result.moves, wasUndo, wasRestore, preApplyIds, preApplyKeys };
    } catch (err) {
      clearProgress();
      throw err;
    }
  }, []);

  const cancel = useCallback(() => cancelSort(), [cancelSort]);

  return { applying, isUndo, applyProgress, rateLimitMsg, startApply, startUndo, startRestore, settle, cancel };
}
