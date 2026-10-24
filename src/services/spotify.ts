import type { Track, Playlist, PlaylistTracksResult, SpotifyUser } from '../types';
import { SPOTIFY_PLAYLIST_PAGE_SIZE, SPOTIFY_TRACK_PAGE_SIZE } from '../utils/constants.ts';

import type {
  SpotifyErrorResponse,
  SpotifyPaging,
  SpotifyPlaylistObject,
  SpotifyPlaylistTrackItem,
  SpotifyUserObject,
} from './spotify.types';

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

const MAX_RATE_LIMIT_RETRIES = 5;
const DEFAULT_RATE_LIMIT_WAIT_SECONDS = 5;
const MAX_RATE_LIMIT_WAIT_SECONDS = 60;

const colorCache = new Map<string, [string, string]>();

export function playlistColors(id: string): [string, string] {
  const cached = colorCache.get(id);
  if (cached) return cached;

  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const pair = COLOR_PAIRS[hash % COLOR_PAIRS.length]!;
  colorCache.set(id, pair);
  return pair;
}

function mapPlaylist(item: SpotifyPlaylistObject): Playlist {
  const [color1, color2] = playlistColors(item.id);
  const imageUrl = item.images?.[0]?.url;
  return {
    id: item.id,
    name: item.name,
    trackCount: item.tracks?.total ?? 0,
    color1,
    color2,
    ...(imageUrl !== undefined && { imageUrl }),
  };
}

function mapTrack(item: SpotifyPlaylistTrackItem): Track | null {
  const track = item.track;
  if (!track || item.is_local || track.uri.startsWith('spotify:local:')) return null;

  return {
    id: track.id || track.uri,
    uri: track.uri,
    name: track.name,
    artist: track.artists?.map((a) => a.name).join(', ') ?? 'Unknown artist',
    album: track.album?.name ?? '',
    albumYear: parseInt(track.album?.release_date?.slice(0, 4) ?? '0', 10),
    trackNumber: track.track_number ?? 0,
    durationMs: track.duration_ms ?? 0,
    addedAt: item.added_at ?? '',
    popularity: track.popularity ?? 0,
  };
}

function parseRetryAfterSeconds(value: string | null): number {
  if (value === null || value.trim() === '') return DEFAULT_RATE_LIMIT_WAIT_SECONDS;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);

  const retryAt = Date.parse(value);
  return Number.isNaN(retryAt)
    ? DEFAULT_RATE_LIMIT_WAIT_SECONDS
    : Math.max(0, (retryAt - Date.now()) / 1000);
}

async function fetchSpotify<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as SpotifyErrorResponse | null;
    const msg = body?.error?.message || body?.error_description || response.statusText || `HTTP ${response.status}`;
    throw new Error(`Spotify API error: ${msg}`);
  }

  return response.json() as Promise<T>;
}

export async function getSpotifyCurrentUser(token: string): Promise<SpotifyUser> {
  const data = await fetchSpotify<SpotifyUserObject>('https://api.spotify.com/v1/me', token);
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
  retry = 0,
): Promise<void> {
  signal?.throwIfAborted();

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: signal ?? null,
  });

  if (response.status === 429) {
    if (retry >= MAX_RATE_LIMIT_RETRIES) {
      throw new Error(`Spotify API rate limit exceeded after ${MAX_RATE_LIMIT_RETRIES} retries.`);
    }

    const retryAfterSeconds = parseRetryAfterSeconds(response.headers.get('Retry-After'));
    if (retryAfterSeconds > MAX_RATE_LIMIT_WAIT_SECONDS) {
      throw new Error(
        `Spotify requested a retry after ${Math.ceil(retryAfterSeconds)} seconds, exceeding the ${MAX_RATE_LIMIT_WAIT_SECONDS}-second maximum wait.`,
      );
    }
    const wait = Math.min(
      MAX_RATE_LIMIT_WAIT_SECONDS,
      Math.ceil(retryAfterSeconds * waitMultiplier * 2 ** retry),
    );
    onRateLimit?.(wait);
    await new Promise<void>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout>;
      const onAbort = () => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        reject(signal?.reason ?? new DOMException('The operation was aborted.', 'AbortError'));
      };
      timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }, wait * 1000);
      signal?.addEventListener('abort', onAbort, { once: true });
      if (signal?.aborted) onAbort();
    });
    return writeSpotify(url, token, method, body, onRateLimit, waitMultiplier, signal, retry + 1);
  }

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    const msg = err?.error?.message || response.statusText || `HTTP ${response.status}`;
    throw new Error(`Spotify API error: ${msg}`);
  }
}

async function fetchAllPages<T>(firstUrl: string, token: string): Promise<T[]> {
  const items: T[] = [];
  let url: string | null = firstUrl;
  while (url) {
    const data: SpotifyPaging<T> = await fetchSpotify<SpotifyPaging<T>>(url, token);
    items.push(...data.items);
    url = data.next;
  }
  return items;
}

export async function getSpotifyPlaylists(token: string): Promise<Playlist[]> {
  const [user, items] = await Promise.all([
    fetchSpotify<SpotifyUserObject>('https://api.spotify.com/v1/me', token),
    fetchAllPages<SpotifyPlaylistObject>(`https://api.spotify.com/v1/me/playlists?limit=${SPOTIFY_PLAYLIST_PAGE_SIZE}`, token),
  ]);
  return items
    .filter((item) => item.owner.id === user.id)
    .map(mapPlaylist);
}

export async function getSpotifyPlaylistTracks(token: string, playlistId: string): Promise<PlaylistTracksResult> {
  const items = await fetchAllPages<SpotifyPlaylistTrackItem>(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${SPOTIFY_TRACK_PAGE_SIZE}`, token);
  const tracks = items.map(mapTrack).filter((t): t is Track => t !== null);
  return { tracks, unsupportedCount: items.length - tracks.length };
}

export async function savePlaylistTracks(
  token: string,
  playlistId: string,
  originalTracks: Track[],
  sortedTracks: Track[],
  onProgress?: (pct: number) => void,
  onRateLimit?: (retryAfterSeconds: number) => void,
  signal?: AbortSignal,
  unsupportedCount = 0,
): Promise<{ moves: number }> {
  if (unsupportedCount > 0) {
    throw new Error('This playlist contains local or unavailable tracks and cannot be safely reordered.');
  }

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

    const targetOrigIdx = target[i]!;
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
      slot.set(current[j]!, j);
    }

    moves++;
    onProgress?.(Math.round((moves / needed) * 100));
  }

  onProgress?.(100);
  return { moves };
}
