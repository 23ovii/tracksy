import type { SortCriterion, SortKey, SortDir } from '../utils/playlistUtils';
import { PRESETS_LIMIT } from '../utils/constants.ts';

export interface SortPreset {
  id: string;
  name: string;
  criteria: SortCriterion[];
  smartOpts?: { shape: string; intensity: number };
  createdAt: number;
}

const KEY = 'tracksy_presets_v1';

const VALID_SORT_KEYS: SortKey[] = ['name', 'artist', 'popularity', 'addedAt', 'durationMs', 'discography'];
const VALID_SORT_DIRS: SortDir[] = ['asc', 'desc'];

function isValidSortKey(v: unknown): v is SortKey {
  return VALID_SORT_KEYS.includes(v as SortKey);
}

function isValidSortDir(v: unknown): v is SortDir {
  return VALID_SORT_DIRS.includes(v as SortDir);
}

function coerceCriteria(value: unknown): SortCriterion[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > VALID_SORT_KEYS.length) return null;
  const criteria: SortCriterion[] = [];
  const seen = new Set<SortKey>();

  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const criterion = item as Record<string, unknown>;
    if (!isValidSortKey(criterion.key) || !isValidSortDir(criterion.direction) || seen.has(criterion.key)) {
      return null;
    }
    seen.add(criterion.key);
    criteria.push({
      key: criterion.key,
      direction: criterion.key === 'discography' ? 'asc' : criterion.direction,
    });
  }
  return criteria;
}

function coercePreset(raw: unknown): SortPreset | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.name !== 'string' || typeof r.createdAt !== 'number') return null;
  let criteria: SortCriterion[] | null;
  if (Array.isArray(r.criteria)) {
    criteria = coerceCriteria(r.criteria);
  } else {
    const key = isValidSortKey(r.sortBy) ? r.sortBy : 'name';
    const direction = key === 'discography' || !isValidSortDir(r.sortDir) ? 'asc' : r.sortDir;
    criteria = [{ key, direction }];
  }
  if (!criteria) return null;
  const preset: SortPreset = {
    id: r.id,
    name: r.name,
    criteria,
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
  if (list.length >= PRESETS_LIMIT) throw new Error(`You can only save up to ${PRESETS_LIMIT} presets. Delete one first.`);
  localStorage.setItem(KEY, JSON.stringify([...list, preset]));
}

export function deletePreset(id: string): void {
  const list = listPresets().filter((p) => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}
