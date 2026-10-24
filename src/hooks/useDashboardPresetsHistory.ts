import { useEffect, useState } from 'react';

import type { SortCriterion } from '../utils/playlistUtils';
import { deletePreset, listPresets, savePreset } from '../services/presets';
import type { SortPreset } from '../services/presets';
import { clearHistory, getHistory, pushHistory } from '../services/sortHistory';
import type { HistoryEntry } from '../services/sortHistory';

export function useDashboardPresetsHistory(playlistId: string | null) {
  const [presets, setPresets] = useState<SortPreset[]>(() => listPresets());
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(playlistId ? getHistory(playlistId) : []);
  }, [playlistId]);

  function saveCurrentPreset(name: string, criteria: SortCriterion[]) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    savePreset({ id, name, criteria, createdAt: Date.now() });
    setPresets(listPresets());
  }

  function removePreset(id: string) {
    deletePreset(id);
    setPresets(listPresets());
  }

  function recordHistory(entry: HistoryEntry) {
    pushHistory(entry);
    setHistory(getHistory(entry.playlistId));
  }

  function removeHistory() {
    if (!playlistId) return;
    clearHistory(playlistId);
    setHistory([]);
  }

  return {
    presets,
    history,
    saveCurrentPreset,
    removePreset,
    recordHistory,
    removeHistory,
  };
}
