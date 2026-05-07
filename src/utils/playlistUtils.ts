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
    // Count how many tracks each artist has in this playlist
    const artistCount = new Map<string, number>();
    for (const t of tracks) {
      artistCount.set(t.artist, (artistCount.get(t.artist) ?? 0) + 1);
    }

    // Count how many tracks each (artist, album) pair has
    const albumKey = (t: Track) => `${t.artist}|||${t.album}`;
    const albumCount = new Map<string, number>();
    for (const t of tracks) {
      const k = albumKey(t);
      albumCount.set(k, (albumCount.get(k) ?? 0) + 1);
    }

    return [...tracks].sort((a, b) => {
      const aArtistCount = artistCount.get(a.artist) ?? 0;
      const bArtistCount = artistCount.get(b.artist) ?? 0;

      // Artists with only 1 song sink to the bottom
      const aAlone = aArtistCount === 1;
      const bAlone = bArtistCount === 1;
      if (aAlone !== bAlone) return aAlone ? 1 : -1;

      // Among solo-artist tracks, preserve original playlist order
      if (aAlone && bAlone) return 0;

      // Artists ranked by total song count, most first
      if (aArtistCount !== bArtistCount) return bArtistCount - aArtistCount;

      // Same artist — rank albums by how many songs from that album are present, most first
      const aAlbumCount = albumCount.get(albumKey(a)) ?? 0;
      const bAlbumCount = albumCount.get(albumKey(b)) ?? 0;
      if (aAlbumCount !== bAlbumCount) return bAlbumCount - aAlbumCount;

      // Same album — sort by track number
      return a.trackNumber - b.trackNumber;
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
