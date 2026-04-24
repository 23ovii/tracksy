import type { Track } from '../types';

export interface SortOption {
  id: string;
  label: string;
  sub: string;
  color: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { id: 'name',        label: 'Title',      sub: 'A → Z',         color: '#7a90aa' },
  { id: 'artist',      label: 'Artist',     sub: 'A → Z',         color: '#7a90aa' },
  { id: 'bpm',         label: 'BPM',        sub: 'Beats per min', color: '#e8622a' },
  { id: 'energy',      label: 'Energy',     sub: 'Calm → Hype',   color: '#f5a623' },
  { id: 'popularity',  label: 'Popularity', sub: 'Chart rank',    color: '#1db954' },
  { id: 'addedAt',     label: 'Date Added', sub: 'Old → New',     color: '#7a90aa' },
  { id: 'durationMs',  label: 'Duration',   sub: 'Short → Long',  color: '#7a90aa' },
];

export function sortTracks(tracks: Track[], by: string, dir: 'asc' | 'desc' = 'asc'): Track[] {
  return [...tracks].sort((a, b) => {
    let va: any = (a as any)[by];
    let vb: any = (b as any)[by];
    if (by === 'addedAt') { va = new Date(va); vb = new Date(vb); }
    if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
    const c = va < vb ? -1 : va > vb ? 1 : 0;
    return dir === 'asc' ? c : -c;
  });
}

export function removeDuplicateTracks(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  return tracks.filter((track) => {
    const key = track.id || `${track.name}-${track.artist}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
