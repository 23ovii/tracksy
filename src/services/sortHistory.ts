export interface HistoryEntry {
  id: string;
  playlistId: string;
  appliedAt: number;
  sortLabel: string;
  trackIdsBefore?: string[];
  trackIdsAfter?: string[];
  trackKeysBefore?: string[];
  trackKeysAfter?: string[];
}

import { HISTORY_PER_PLAYLIST_LIMIT } from '../utils/constants.ts';

const STORAGE_KEY = 'tracksy_sort_history_v1';
const HISTORY_TOTAL_LIMIT = 100;
const HISTORY_STORAGE_CHAR_LIMIT = 1_000_000;

function readAll(): Record<string, HistoryEntry[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, HistoryEntry[]>): void {
  const entries = Object.values(data).flat().sort((a, b) => a.appliedAt - b.appliedAt);
  const retained = entries.slice(-HISTORY_TOTAL_LIMIT);
  const compacted: Record<string, HistoryEntry[]> = {};

  for (const entry of retained) {
    const playlistEntries = compacted[entry.playlistId] ?? [];
    playlistEntries.push(compactHistoryEntry(entry));
    compacted[entry.playlistId] = playlistEntries.slice(-HISTORY_PER_PLAYLIST_LIMIT);
  }

  let serialized = JSON.stringify(compacted);
  while (serialized.length > HISTORY_STORAGE_CHAR_LIMIT && retained.length > 1) {
    const oldest = retained.shift()!;
    const playlistEntries = compacted[oldest.playlistId];
    if (playlistEntries) {
      const index = playlistEntries.findIndex((entry) => entry.id === oldest.id);
      if (index !== -1) playlistEntries.splice(index, 1);
      if (playlistEntries.length === 0) delete compacted[oldest.playlistId];
    }
    serialized = JSON.stringify(compacted);
  }

  if (serialized.length > HISTORY_STORAGE_CHAR_LIMIT) {
    throw new Error('Could not save sort history because this playlist order exceeds the browser storage limit.');
  }

  try {
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    throw new Error('Could not save sort history because browser storage is unavailable or full.');
  }
}

function compactHistoryEntry(entry: HistoryEntry): HistoryEntry {
  const {
    trackIdsBefore,
    trackIdsAfter,
    trackKeysBefore,
    trackKeysAfter,
    ...metadata
  } = entry;

  return {
    ...metadata,
    ...(trackKeysBefore
      ? { trackKeysBefore }
      : trackIdsBefore ? { trackIdsBefore } : {}),
    ...(trackKeysAfter
      ? { trackKeysAfter }
      : trackIdsAfter ? { trackIdsAfter } : {}),
  };
}

export function getHistory(playlistId: string): HistoryEntry[] {
  return readAll()[playlistId] ?? [];
}

export function pushHistory(entry: HistoryEntry): void {
  const all = readAll();
  const entries = all[entry.playlistId] ?? [];
  entries.push(entry);
  all[entry.playlistId] = entries.slice(-HISTORY_PER_PLAYLIST_LIMIT);
  writeAll(all);
}

export function clearHistory(playlistId: string): void {
  const all = readAll();
  delete all[playlistId];
  writeAll(all);
}
