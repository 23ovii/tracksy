import type { Track, Playlist, SpotifyUser } from '../types';

const COLOR_PAIRS: [string, string][] = [
  ['#e8622a', '#e84080'],
  ['#7c5cbf', '#3a1fa8'],
  ['#1db954', '#0e7a38'],
  ['#e8a020', '#e85a20'],
  ['#c2445a', '#8b1a3a'],
  ['#1e8ac4', '#0a4a80'],
  ['#20b89a', '#0a6a58'],
  ['#e87020', '#c43010'],
  ['#9b72f5', '#5a28c0'],
  ['#d4547a', '#901840'],
  ['#5a9e6f', '#2a6040'],
  ['#e83060', '#a01040'],
  ['#c8963c', '#7a5418'],
  ['#2472d4', '#103090'],
];

export function playlistColors(id: string): [string, string] {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLOR_PAIRS[hash % COLOR_PAIRS.length];
}

function mapPlaylist(item: any): Playlist {
  const [color1, color2] = playlistColors(item.id);
  return {
    id: item.id,
    name: item.name,
    trackCount: item.tracks?.total ?? 0,
    color1,
    color2,
    imageUrl: item.images?.[0]?.url,
  };
}

function mapTrack(item: any): Track | null {
  const track = item.track;
  if (!track) return null;

  return {
    id: track.id || track.uri,
    uri: track.uri as string,
    name: track.name,
    artist: track.artists?.map((a: any) => a.name).join(', ') ?? 'Unknown artist',
    album: track.album?.name ?? '',
    albumYear: parseInt(track.album?.release_date?.slice(0, 4) ?? '0', 10),
    trackNumber: track.track_number ?? 0,
    durationMs: track.duration_ms ?? 0,
    addedAt: item.added_at ?? '',
    popularity: track.popularity ?? 0,
  };
}

async function fetchSpotify(url: string, token: string): Promise<any> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const msg = body?.error?.message || body?.error_description || response.statusText || `HTTP ${response.status}`;
    throw new Error(`Spotify API error: ${msg}`);
  }

  return response.json();
}

export async function getSpotifyCurrentUser(token: string): Promise<SpotifyUser> {
  const data = await fetchSpotify('https://api.spotify.com/v1/me', token);
  return {
    id: data.id,
    display_name: data.display_name ?? null,
    images: data.images ?? [],
  };
}

async function writeSpotify(
  url: string,
  token: string,
  method: string,
  body: object,
  onRateLimit?: (retryAfterSeconds: number) => void,
  waitMultiplier = 1,
  signal?: AbortSignal,
): Promise<void> {
  signal?.throwIfAborted();

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (response.status === 429) {
    const base = parseInt(response.headers.get('Retry-After') ?? '5', 10);
    const wait = base * waitMultiplier;
    onRateLimit?.(wait);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, wait * 1000);
      signal?.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
    });
    return writeSpotify(url, token, method, body, onRateLimit, waitMultiplier, signal);
  }

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    const msg = err?.error?.message || response.statusText || `HTTP ${response.status}`;
    throw new Error(`Spotify API error: ${msg}`);
  }
}

async function fetchAllPages(firstUrl: string, token: string): Promise<any[]> {
  const items: any[] = [];
  let url: string | null = firstUrl;
  while (url) {
    const data = await fetchSpotify(url, token);
    items.push(...data.items);
    url = data.next;
  }
  return items;
}

export async function getSpotifyPlaylists(token: string): Promise<Playlist[]> {
  const [user, items] = await Promise.all([
    fetchSpotify('https://api.spotify.com/v1/me', token),
    fetchAllPages('https://api.spotify.com/v1/me/playlists?limit=50', token),
  ]);
  return items
    .filter((item: any) => item.owner.id === user.id)
    .map(mapPlaylist);
}

export async function getSpotifyPlaylistTracks(token: string, playlistId: string): Promise<Track[]> {
  const items = await fetchAllPages(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`, token);
  return items.map(mapTrack).filter((t): t is Track => t !== null);
}

export async function savePlaylistTracks(
  token: string,
  playlistId: string,
  originalTracks: Track[],
  sortedTracks: Track[],
  onProgress?: (pct: number) => void,
  onRateLimit?: (retryAfterSeconds: number) => void,
  signal?: AbortSignal,
): Promise<{ moves: number }> {
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
  let moves = 0;
  let rateLimitHits = 0;

  // Use original position index as identity — handles duplicate track IDs correctly.
  // indexOf(id) always finds the first duplicate copy, causing position divergence.
  const originalIndex = new Map<Track, number>();
  originalTracks.forEach((t, i) => originalIndex.set(t, i));

  const current: number[] = originalTracks.map((_, i) => i);
  const target: number[] = sortedTracks.map((t) => originalIndex.get(t) ?? -1);

  const needed = target.filter((origIdx, i) => current[i] !== origIdx).length;

  if (needed === 0) {
    onProgress?.(100);
    return { moves: 0 };
  }

  // For small playlists where most tracks need moving, replace the whole order
  // in one PUT instead of issuing N individual reorder requests.
  if (originalTracks.length <= 100 && needed > originalTracks.length / 2) {
    signal?.throwIfAborted();
    await writeSpotify(url, token, 'PUT', { uris: sortedTracks.map((t) => t.uri) }, onRateLimit, 1, signal);
    onProgress?.(100);
    return { moves: needed };
  }

  // slot: origIdx → current position in current[]. Maintained alongside current[]
  // so lookups are O(1) instead of O(n) indexOf.
  const slot = new Map<number, number>();
  current.forEach((origIdx, pos) => slot.set(origIdx, pos));

  for (let i = 0; i < target.length; i++) {
    signal?.throwIfAborted();

    const targetOrigIdx = target[i];
    const currentPos = slot.get(targetOrigIdx)!;
    if (currentPos === i) continue;

    // After 5 rate limit hits, double the wait time; after 10, triple; etc.
    const multiplier = 1 + Math.floor(rateLimitHits / 5);

    await writeSpotify(url, token, 'PUT', {
      range_start: currentPos,
      insert_before: i,
      range_length: 1,
    }, (wait) => {
      rateLimitHits++;
      onRateLimit?.(wait);
    }, multiplier, signal);

    current.splice(currentPos, 1);
    current.splice(i, 0, targetOrigIdx);

    // Update slot for the affected range in O(distance) — the splice shifts
    // every entry between currentPos and i by ±1.
    const lo = Math.min(currentPos, i);
    const hi = Math.max(currentPos, i);
    for (let j = lo; j <= hi; j++) {
      slot.set(current[j], j);
    }

    moves++;
    onProgress?.(Math.round((moves / needed) * 100));
  }

  onProgress?.(100);
  return { moves };
}
