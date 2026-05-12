import type { SortKey, SortDir } from '../utils/playlistUtils';

export interface SortPreset {
  id: string;
  name: string;
  sortBy: SortKey;
  sortDir: SortDir;
  smartOpts?: { shape: string; intensity: number };
  createdAt: number;
}

const KEY = 'tracksy_presets_v1';
const MAX = 20;

const VALID_SORT_KEYS: SortKey[] = ['name', 'artist', 'popularity', 'addedAt', 'durationMs', 'discography'];
const VALID_SORT_DIRS: SortDir[] = ['asc', 'desc'];

function isValidSortKey(v: unknown): v is SortKey {
  return VALID_SORT_KEYS.includes(v as SortKey);
}

function isValidSortDir(v: unknown): v is SortDir {
  return VALID_SORT_DIRS.includes(v as SortDir);
}

function coercePreset(raw: unknown): SortPreset | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.name !== 'string' || typeof r.createdAt !== 'number') return null;
  const preset: SortPreset = {
    id: r.id,
    name: r.name,
    sortBy: isValidSortKey(r.sortBy) ? r.sortBy : 'name',
    sortDir: isValidSortDir(r.sortDir) ? r.sortDir : 'asc',
    createdAt: r.createdAt,
  };
  if (r.smartOpts && typeof r.smartOpts === 'object') {
    const s = r.smartOpts as Record<string, unknown>;
    if (typeof s.shape === 'string' && typeof s.intensity === 'number' && Number.isFinite(s.intensity)) {
      preset.smartOpts = { shape: s.shape, intensity: s.intensity };
    }
  }
  return preset;
}

export function listPresets(): SortPreset[] {
  try {
    const raw: unknown[] = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? raw.map(coercePreset).filter((p): p is SortPreset => p !== null) : [];
  } catch {
    return [];
  }
}

export function savePreset(preset: SortPreset): void {
  const list = listPresets();
  if (list.length >= MAX) throw new Error('You can only save up to 20 presets. Delete one first.');
  localStorage.setItem(KEY, JSON.stringify([...list, preset]));
}

export function deletePreset(id: string): void {
  const list = listPresets().filter((p) => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}
