export interface HistoryEntry {
  id: string;
  playlistId: string;
  appliedAt: number;
  sortLabel: string;
  trackIdsBefore: string[];
  trackIdsAfter: string[];
  trackKeysBefore?: string[];
  trackKeysAfter?: string[];
}

import { HISTORY_PER_PLAYLIST_LIMIT } from '../utils/constants.ts';

const STORAGE_KEY = 'tracksy_sort_history_v1';

function readAll(): Record<string, HistoryEntry[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, HistoryEntry[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
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
