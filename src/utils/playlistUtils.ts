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
    const normalAlbum = (t: Track) => t.album.toLowerCase().trim();
    const primaryArtist = (t: Track) => t.artist.split(',')[0].trim().toLowerCase();

    // Group tracks by album name — album is the source of truth, not artist string
    const albumTracks = new Map<string, Track[]>();
    for (const t of tracks) {
      const k = normalAlbum(t);
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
      const canonical = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
      albumArtist.set(album, canonical);
    }

    // Count total tracks per canonical artist
    const artistCount = new Map<string, number>();
    for (const [album, members] of albumTracks) {
      const artist = albumArtist.get(album)!;
      artistCount.set(artist, (artistCount.get(artist) ?? 0) + members.length);
    }

    // Original index for stable tie-breaking
    const originalIndex = new Map<Track, number>();
    tracks.forEach((t, i) => originalIndex.set(t, i));

    // First appearance of each album in the original playlist — keeps equal-count albums stable
    const albumFirstSeen = new Map<string, number>();
    tracks.forEach((t, i) => {
      const k = normalAlbum(t);
      if (!albumFirstSeen.has(k)) albumFirstSeen.set(k, i);
    });

    // First appearance of each canonical artist in the original playlist
    const artistFirstSeen = new Map<string, number>();
    tracks.forEach((t, i) => {
      const artist = albumArtist.get(normalAlbum(t))!;
      if (!artistFirstSeen.has(artist)) artistFirstSeen.set(artist, i);
    });

    return [...tracks].sort((a, b) => {
      const aArtist = albumArtist.get(normalAlbum(a))!;
      const bArtist = albumArtist.get(normalAlbum(b))!;
      const aArtistCount = artistCount.get(aArtist) ?? 0;
      const bArtistCount = artistCount.get(bArtist) ?? 0;

      // Artists with only 1 song in the playlist sink to the bottom
      const aAlone = aArtistCount === 1;
      const bAlone = bArtistCount === 1;
      if (aAlone !== bAlone) return aAlone ? 1 : -1;
      if (aAlone && bAlone) return (originalIndex.get(a) ?? 0) - (originalIndex.get(b) ?? 0);

      // Rank artists by total track count, most first; tie → first appearance in playlist
      if (aArtistCount !== bArtistCount) return bArtistCount - aArtistCount;
      if (aArtist !== bArtist) return (artistFirstSeen.get(aArtist) ?? 0) - (artistFirstSeen.get(bArtist) ?? 0);

      // Same artist — single-track albums sink to the bottom of the artist's section
      const aAlbumSize = albumTracks.get(normalAlbum(a))?.length ?? 0;
      const bAlbumSize = albumTracks.get(normalAlbum(b))?.length ?? 0;
      const aAlbumAlone = aAlbumSize === 1;
      const bAlbumAlone = bAlbumSize === 1;
      if (aAlbumAlone !== bAlbumAlone) return aAlbumAlone ? 1 : -1;

      // Rank albums by track count, most first; tie → first appearance in playlist
      if (aAlbumSize !== bAlbumSize) return bAlbumSize - aAlbumSize;
      const aAlbum = normalAlbum(a);
      const bAlbum = normalAlbum(b);
      if (aAlbum !== bAlbum) return (albumFirstSeen.get(aAlbum) ?? 0) - (albumFirstSeen.get(bAlbum) ?? 0);

      // Same album — sort by track number
      if (a.trackNumber !== b.trackNumber) return a.trackNumber - b.trackNumber;

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
