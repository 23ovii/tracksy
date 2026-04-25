import type { Track, Playlist } from '../types';

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

function playlistColors(id: string): [string, string] {
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
    name: track.name,
    artist: track.artists?.map((a: any) => a.name).join(', ') ?? 'Unknown artist',
    album: track.album?.name ?? '',
    durationMs: track.duration_ms ?? 0,
    addedAt: item.added_at ?? '',
    popularity: track.popularity ?? 0,
    bpm: 0,
    energy: 0,
  };
}

async function fetchSpotify(url: string, token: string): Promise<any> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Spotify API error: ${error.error_description || error.error || response.statusText}`);
  }

  return response.json();
}

async function writeSpotify(
  url: string,
  token: string,
  method: string,
  body: object,
  onRateLimit?: (retryAfterSeconds: number) => void,
): Promise<void> {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') ?? '5', 10);
    onRateLimit?.(retryAfter);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return writeSpotify(url, token, method, body, onRateLimit);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Spotify API error: ${error.error?.message || response.statusText}`);
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

export async function getAudioFeatures(token: string, trackIds: string[]): Promise<Record<string, { bpm: number; energy: number }>> {
  const features: Record<string, { bpm: number; energy: number }> = {};
  for (let i = 0; i < trackIds.length; i += 100) {
    const ids = trackIds.slice(i, i + 100).join(',');
    const data = await fetchSpotify(`https://api.spotify.com/v1/audio-features?ids=${ids}`, token);
    data.audio_features.forEach((f: any) => {
      if (f) features[f.id] = { bpm: Math.round(f.tempo), energy: f.energy };
    });
  }
  return features;
}

export async function savePlaylistTracks(
  token: string,
  playlistId: string,
  originalTracks: Track[],
  sortedTracks: Track[],
  onProgress?: (pct: number) => void,
  onRateLimit?: (retryAfterSeconds: number) => void,
): Promise<void> {
  const current = originalTracks.map((t) => t.id);
  const target = sortedTracks.map((t) => t.id);
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
  let moves = 0;

  const needed = target.filter((id, i) => current.indexOf(id) !== i).length;

  for (let i = 0; i < target.length; i++) {
    const currentPos = current.indexOf(target[i]);
    if (currentPos === i) continue;

    await writeSpotify(url, token, 'PUT', {
      range_start: currentPos,
      insert_before: i,
      range_length: 1,
    }, onRateLimit);

    current.splice(currentPos, 1);
    current.splice(i, 0, target[i]);
    moves++;
    onProgress?.(needed > 0 ? Math.round((moves / needed) * 100) : 100);
  }

  onProgress?.(100);
}
