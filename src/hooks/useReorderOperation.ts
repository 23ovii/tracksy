import { useCallback, useEffect, useRef, useState } from 'react';

import type { ReorderVars } from '../api/mutations';
import type { Track } from '../types';
import type { SortKey } from '../utils/playlistUtils';

export interface ReorderOperationMetadata {
  kind: 'sort' | 'undo' | 'restore';
  playlistId: string;
  playlistName: string;
  sortBy: SortKey;
  sortedTracks: Track[];
  previousTrackIds: string[];
  previousTrackKeys: string[];
}

interface UseReorderOperationOptions {
  mutateAsync: (variables: ReorderVars) => Promise<{ moves: number }>;
  onError: (error: unknown) => void;
}

export function useReorderOperation({ mutateAsync, onError }: UseReorderOperationOptions) {
  const [applying, setApplying] = useState(false);
  const [isUndo, setIsUndo] = useState(false);
  const [applyProgress, setApplyProgress] = useState(0);
  const [rateLimitMsg, setRateLimitMsg] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const mutationPromiseRef = useRef<Promise<{ moves: number }> | null>(null);
  const operationMetadataRef = useRef<ReorderOperationMetadata | null>(null);
  const mountedRef = useRef(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const start = useCallback((
    previous: Track[],
    sorted: Track[],
    metadata: ReorderOperationMetadata,
    canStart: boolean,
  ) => {
    if (!canStart) return false;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    operationMetadataRef.current = metadata;
    setApplying(true);
    setIsUndo(metadata.kind === 'undo');
    setApplyProgress(0);
    setRateLimitMsg('');

    const promise = mutateAsync({
      previous,
      sorted,
      abortSignal: controller.signal,
      onProgress: (progress) => {
        if (mountedRef.current) setApplyProgress(progress);
      },
      onRateLimit: (seconds) => {
        if (mountedRef.current) setRateLimitMsg(`Rate limited by Spotify — retrying in ${seconds}s…`);
      },
    });
    mutationPromiseRef.current = promise;
    void promise.catch((error: unknown) => {
      if (!mountedRef.current) return;
      onErrorRef.current(error);
      setApplying(false);
      setApplyProgress(0);
      setRateLimitMsg('');
      abortControllerRef.current = null;
      mutationPromiseRef.current = null;
      operationMetadataRef.current = null;
    });

    return true;
  }, [mutateAsync]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const complete = useCallback(async () => {
    const promise = mutationPromiseRef.current;
    const metadata = operationMetadataRef.current;
    if (!promise || !metadata) return null;

    try {
      const result = await promise;
      setApplying(false);
      setApplyProgress(0);
      setRateLimitMsg('');
      abortControllerRef.current = null;
      mutationPromiseRef.current = null;
      operationMetadataRef.current = null;
      return { ...result, metadata };
    } catch {
      return null;
    }
  }, []);

  return {
    applying,
    isUndo,
    applyProgress,
    rateLimitMsg,
    start,
    cancel,
    complete,
  };
}
