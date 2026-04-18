const playlists = [
  {
    id: 'pl-001',
    name: 'Midnight Chill',
    trackCount: 18,
    description: 'A late-night chill blend with mellow beats.',
  },
  {
    id: 'pl-002',
    name: 'Fresh Vibes',
    trackCount: 14,
    description: 'Easy-going songs for work, coffee, and focus.',
  },
  {
    id: 'pl-003',
    name: 'Sunset Drive',
    trackCount: 22,
    description: 'Warm grooves for golden hour and road trips.',
  },
  {
    id: 'pl-004',
    name: 'Top Discovery',
    trackCount: 12,
    description: 'Curated discovery recommendations for your next favorite.',
  },
  {
    id: 'pl-005',
    name: 'Deep House Hour',
    trackCount: 16,
    description: 'Underground house anthems with clean bass lines.',
  },
];

const playlistTracks = {
  'pl-001': [
    { id: 't-001', name: 'Lunar Glow', artist: 'Nova Wells', durationMs: 199000 },
    { id: 't-002', name: 'Quiet Northern Sky', artist: 'Echo Harbor', durationMs: 215000 },
    { id: 't-003', name: 'After Hours', artist: 'Solace Theory', durationMs: 183000 },
    { id: 't-004', name: 'Hush', artist: 'Prism Drive', durationMs: 207000 },
  ],
  'pl-002': [
    { id: 't-005', name: 'A.M. Coffee', artist: 'Seaside Lounge', durationMs: 168000 },
    { id: 't-006', name: 'Neon Palms', artist: 'Waveform', durationMs: 203000 },
    { id: 't-007', name: 'Fresh Start', artist: 'Mira Lane', durationMs: 190000 },
    { id: 't-008', name: 'Slow Motion', artist: 'Gemini Pulse', durationMs: 221000 },
  ],
  'pl-003': [
    { id: 't-009', name: 'Roadside', artist: 'Atlas Bloom', durationMs: 204000 },
    { id: 't-010', name: 'Breeze', artist: 'Ora Rae', durationMs: 187000 },
    { id: 't-011', name: 'Gold Haze', artist: 'The Tropics', durationMs: 233000 },
    { id: 't-012', name: 'Wide Open', artist: 'Jaymi Nova', durationMs: 195000 },
  ],
  'pl-004': [
    { id: 't-013', name: 'First Listen', artist: 'Horizon Atlas', durationMs: 211000 },
    { id: 't-014', name: 'New Dawn', artist: 'Skyline Theory', durationMs: 179000 },
    { id: 't-015', name: 'Bright Signal', artist: 'Sonder', durationMs: 202000 },
    { id: 't-016', name: 'Fresh Static', artist: 'Luna Loom', durationMs: 196000 },
  ],
  'pl-005': [
    { id: 't-017', name: 'Pulse Control', artist: 'Stereo Frame', durationMs: 225000 },
    { id: 't-018', name: 'Night Shift', artist: 'Rift Opera', durationMs: 218000 },
    { id: 't-019', name: 'Glow', artist: 'Phase Motion', durationMs: 209000 },
    { id: 't-020', name: 'Echo Chamber', artist: 'Velvet Storm', durationMs: 212000 },
  ],
};

function mapPlaylist(item) {
  return {
    id: item.id,
    name: item.name,
    trackCount: item.tracks?.total ?? 0,
    description: item.description || `Playlist by ${item.owner?.display_name || item.owner?.id || 'Spotify'}`,
  };
}

function mapTrack(item) {
  const track = item.track;
  if (!track) {
    return null;
  }

  return {
    id: track.id || track.uri,
    name: track.name,
    artist: track.artists?.map((artist) => artist.name).join(', ') ?? 'Unknown artist',
    durationMs: track.duration_ms ?? 0,
  };
}

async function fetchSpotify(endpoint, token) {
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error.error_description || error.error || response.statusText;
    throw new Error(`Spotify API error: ${message}`);
  }

  return response.json();
}

export async function getSpotifyPlaylists(token) {
  const data = await fetchSpotify('https://api.spotify.com/v1/me/playlists?limit=50', token);
  return data.items.map(mapPlaylist);
}

export async function getSpotifyPlaylistTracks(token, playlistId) {
  const data = await fetchSpotify(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`, token);
  return data.items.map(mapTrack).filter(Boolean);
}

export async function getMockPlaylists() {
  await new Promise((resolve) => setTimeout(resolve, 240));
  return playlists;
}

export async function getMockPlaylistTracks(playlistId) {
  await new Promise((resolve) => setTimeout(resolve, 220));
  return playlistTracks[playlistId] ?? [];
}
