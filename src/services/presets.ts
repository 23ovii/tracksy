export interface SortPreset {
  id: string;
  name: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  smartOpts?: { shape: string; intensity: number };
  createdAt: number;
}

const KEY = 'tracksy_presets_v1';
const MAX = 20;

export function listPresets(): SortPreset[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
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
