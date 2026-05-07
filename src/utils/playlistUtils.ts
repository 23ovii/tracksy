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
  { id: 'popularity',  label: 'Popularity', sub: 'Chart rank',    color: '#1db954' },
  { id: 'addedAt',     label: 'Date Added', sub: 'Old → New',     color: '#7a90aa' },
  { id: 'durationMs',    label: 'Duration',     sub: 'Short → Long',  color: '#7a90aa' },
  { id: 'discography',   label: 'Discography',  sub: 'Artist · Album', color: '#b57bee' },
];

export function sortTracks(tracks: Track[], by: string, dir: 'asc' | 'desc' = 'asc'): Track[] {
  if (by === 'discography') {
    // Use only the first artist for grouping so featured tracks stay with their primary artist
    const primaryArtist = (t: Track) => t.artist.split(',')[0].trim().toLowerCase();
    const albumKey = (t: Track) => `${primaryArtist(t)}|||${t.album.toLowerCase()}`;

    // Count tracks per primary artist
    const artistCount = new Map<string, number>();
    for (const t of tracks) {
      const pa = primaryArtist(t);
      artistCount.set(pa, (artistCount.get(pa) ?? 0) + 1);
    }

    // Count tracks per (primary artist, album) pair
    const albumCount = new Map<string, number>();
    for (const t of tracks) {
      const k = albumKey(t);
      albumCount.set(k, (albumCount.get(k) ?? 0) + 1);
    }

    // Remember original index so ties preserve playlist order
    const originalIndex = new Map<Track, number>();
    tracks.forEach((t, i) => originalIndex.set(t, i));

    return [...tracks].sort((a, b) => {
      const aCount = artistCount.get(primaryArtist(a)) ?? 0;
      const bCount = artistCount.get(primaryArtist(b)) ?? 0;

      // Artists with only 1 song sink to the bottom
      const aAlone = aCount === 1;
      const bAlone = bCount === 1;
      if (aAlone !== bAlone) return aAlone ? 1 : -1;
      if (aAlone && bAlone) return (originalIndex.get(a) ?? 0) - (originalIndex.get(b) ?? 0);

      // Artists ranked by total song count, most first
      if (aCount !== bCount) return bCount - aCount;

      // Same primary artist — rank albums by track count in playlist, most first
      const aAlbumCount = albumCount.get(albumKey(a)) ?? 0;
      const bAlbumCount = albumCount.get(albumKey(b)) ?? 0;
      if (aAlbumCount !== bAlbumCount) return bAlbumCount - aAlbumCount;

      // Same album — sort by track number
      if (a.trackNumber !== b.trackNumber) return a.trackNumber - b.trackNumber;

      // Fallback: preserve original playlist order
      return (originalIndex.get(a) ?? 0) - (originalIndex.get(b) ?? 0);
    });
  }

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
