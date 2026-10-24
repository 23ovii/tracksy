import type { Track } from '../types';

export type SortKey = 'name' | 'artist' | 'popularity' | 'addedAt' | 'durationMs' | 'discography';
export type SortDir = 'asc' | 'desc';

export interface SortCriterion {
  key: SortKey;
  direction: SortDir;
}

export interface SortOption {
  id: SortKey;
  label: string;
  sub: string;
  color: string;
}

export const SORT_OPTIONS = [
  { id: 'name',        label: 'Title',       sub: 'A → Z',          color: '#7a90aa' },
  { id: 'artist',      label: 'Artist',      sub: 'A → Z',          color: '#7a90aa' },
  { id: 'popularity',  label: 'Popularity',  sub: 'Chart rank',     color: '#1db954' },
  { id: 'addedAt',     label: 'Date Added',  sub: 'Old → New',      color: '#7a90aa' },
  { id: 'durationMs',  label: 'Duration',    sub: 'Short → Long',   color: '#7a90aa' },
  { id: 'discography', label: 'Discography', sub: 'Artist · Album', color: '#b57bee' },
] as const satisfies ReadonlyArray<SortOption>;

type Comparable = Pick<Track, 'name' | 'artist' | 'popularity' | 'addedAt' | 'durationMs'>;

const COMPARATORS: Record<keyof Comparable, (a: Track, b: Track) => number> = {
  name:       (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
  artist:     (a, b) => a.artist.toLowerCase().localeCompare(b.artist.toLowerCase()),
  popularity: (a, b) => a.popularity - b.popularity,
  addedAt:    (a, b) => a.addedAt.localeCompare(b.addedAt),
  durationMs: (a, b) => a.durationMs - b.durationMs,
};

export function sortCriteriaLabel(criteria: readonly SortCriterion[]): string {
  return criteria.map(({ key, direction }) => {
    const label = SORT_OPTIONS.find((option) => option.id === key)?.label ?? key;
    if (key === 'discography') return label;
    return `${label} ${direction === 'asc' ? '↑' : '↓'}`;
  }).join(', then ');
}

export function sortTracks(
  tracks: Track[],
  by: SortKey | readonly SortCriterion[],
  dir: SortDir = 'asc',
): Track[] {
  const criteria = typeof by === 'string' ? [{ key: by, direction: dir }] : by;
  const compareDiscography = criteria.some(({ key }) => key === 'discography')
    ? createDiscographyComparator(tracks)
    : null;

  return [...tracks].sort((a, b) => {
    for (const criterion of criteria) {
      let comparison: number;
      if (criterion.key === 'discography') {
        if (!compareDiscography) throw new Error('Discography comparator was not initialized.');
        comparison = compareDiscography(a, b);
      } else {
        comparison = (criterion.direction === 'asc' ? 1 : -1) * COMPARATORS[criterion.key](a, b);
      }
      if (comparison !== 0) return comparison;
    }
    return 0;
  });
}

function createDiscographyComparator(tracks: Track[]): (a: Track, b: Track) => number {
  const normalAlbum = (t: Track) => t.album.toLowerCase().trim();
  const primaryArtist = (t: Track) => t.artist.split(',')[0]!.trim().toLowerCase();
  const albumKey = (t: Track) => {
    if (t.albumId) return `id:${t.albumId}`;
    return `name:${normalAlbum(t)}\u0000artist:${primaryArtist(t)}`;
  };

  // Prefer Spotify album identity; fall back to album name and primary artist.
  const albumTracks = new Map<string, Track[]>();
  for (const t of tracks) {
    const k = albumKey(t);
    if (!albumTracks.has(k)) albumTracks.set(k, []);
    albumTracks.get(k)!.push(t);
  }

  // For each album, pick the most frequent primary artist as the canonical artist
  const albumArtist = new Map<string, string>();
  for (const [album, members] of albumTracks) {
    const freq = new Map<string, number>();
    for (const t of members) {
      const pa = primaryArtist(t);
      freq.set(pa, (freq.get(pa) ?? 0) + 1);
    }
    const canonical = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]![0];
    albumArtist.set(album, canonical);
  }

  // Count total tracks per canonical artist
  const artistCount = new Map<string, number>();
  for (const [album, members] of albumTracks) {
    const artist = albumArtist.get(album)!;
    artistCount.set(artist, (artistCount.get(artist) ?? 0) + members.length);
  }

  // First appearance of each album in the original playlist — keeps equal-count albums stable
  const albumFirstSeen = new Map<string, number>();
  tracks.forEach((t, i) => {
    const k = albumKey(t);
    if (!albumFirstSeen.has(k)) albumFirstSeen.set(k, i);
  });

  // First appearance of each canonical artist in the original playlist
  const artistFirstSeen = new Map<string, number>();
  tracks.forEach((t, i) => {
    const artist = albumArtist.get(albumKey(t))!;
    if (!artistFirstSeen.has(artist)) artistFirstSeen.set(artist, i);
  });

  return (a, b) => {
    const aAlbumKey = albumKey(a);
    const bAlbumKey = albumKey(b);
    const aArtist = albumArtist.get(aAlbumKey)!;
    const bArtist = albumArtist.get(bAlbumKey)!;
    const aArtistCount = artistCount.get(aArtist) ?? 0;
    const bArtistCount = artistCount.get(bArtist) ?? 0;

    const aAlbumSize = albumTracks.get(aAlbumKey)?.length ?? 0;
    const bAlbumSize = albumTracks.get(bAlbumKey)?.length ?? 0;

    // Albums with fewer than 3 tracks, or artists with only 1 song, sink to the very bottom
    const aAlone = aArtistCount === 1 || aAlbumSize < 3;
    const bAlone = bArtistCount === 1 || bAlbumSize < 3;
    if (aAlone !== bAlone) return aAlone ? 1 : -1;
    if (aAlone && bAlone) return 0;

    // Rank artists by total track count, most first; tie → first appearance in playlist
    if (aArtistCount !== bArtistCount) return bArtistCount - aArtistCount;
    if (aArtist !== bArtist) return (artistFirstSeen.get(aArtist) ?? 0) - (artistFirstSeen.get(bArtist) ?? 0);

    // Rank albums by track count, most first; tie → first appearance in playlist
    if (aAlbumSize !== bAlbumSize) return bAlbumSize - aAlbumSize;
    if (aAlbumKey !== bAlbumKey) {
      return (albumFirstSeen.get(aAlbumKey) ?? 0) - (albumFirstSeen.get(bAlbumKey) ?? 0);
    }

    // Same album — sort by track number
    if (a.trackNumber !== b.trackNumber) return a.trackNumber - b.trackNumber;

    return 0;
  };
}
