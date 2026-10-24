import { afterEach, describe, it, expect, vi } from 'vitest';

import { getSpotifyPlaylistTracks, playlistColors, savePlaylistTracks } from './spotify';

const COLOR_PAIRS_LENGTH = 14;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('playlistColors', () => {
  it('returns the same color pair for the same id (deterministic)', () => {
    const a = playlistColors('playlist-abc-123');
    const b = playlistColors('playlist-abc-123');
    expect(a).toEqual(b);
  });

  it('returns a tuple of two hex color strings', () => {
    const [c1, c2] = playlistColors('some-id');
    expect(c1).toMatch(/^#[0-9a-f]{6}$/i);
    expect(c2).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('distributes across at least 5 unique pairs given 100 random ids', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const pair = playlistColors(`playlist-${i}-${Math.random()}`);
      seen.add(pair.join(','));
    }
    expect(seen.size).toBeGreaterThan(5);
  });

  it('stays within the COLOR_PAIRS array bounds', () => {
    for (let i = 0; i < 200; i++) {
      const [c1, c2] = playlistColors(`id-${i}`);
      expect(c1).toBeTruthy();
      expect(c2).toBeTruthy();
    }
  });

  it(`covers all ${COLOR_PAIRS_LENGTH} pairs given enough ids`, () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const pair = playlistColors(`seed-${i}`);
      seen.add(pair.join(','));
    }
    expect(seen.size).toBe(COLOR_PAIRS_LENGTH);
  });
});

describe('getSpotifyPlaylistTracks', () => {
  it('reports local and unavailable tracks so reorder operations can be blocked', async () => {
    const validTrack = {
      id: 'track-1',
      uri: 'spotify:track:track-1',
      name: 'Song',
      artists: [{ id: 'artist-1', name: 'Artist' }],
      album: { name: 'Album', release_date: '2020' },
      track_number: 1,
      duration_ms: 180000,
      popularity: 50,
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [
        { track: validTrack, is_local: false, added_at: '2020-01-01T00:00:00Z' },
        { track: { ...validTrack, id: null, uri: 'spotify:local:local-track' }, is_local: true, added_at: null },
        { track: null, is_local: false, added_at: null },
      ],
      next: null,
      total: 3,
    }), { status: 200 })));

    await expect(getSpotifyPlaylistTracks('token', 'playlist-1')).resolves.toEqual({
      tracks: [{
        id: 'track-1',
        uri: 'spotify:track:track-1',
        name: 'Song',
        artist: 'Artist',
        album: 'Album',
        albumYear: 2020,
        trackNumber: 1,
        durationMs: 180000,
        addedAt: '2020-01-01T00:00:00Z',
        popularity: 50,
      }],
      unsupportedCount: 2,
    });
  });
});

describe('savePlaylistTracks', () => {
  it('refuses to reorder a playlist containing unsupported tracks', async () => {
    await expect(
      savePlaylistTracks('token', 'playlist-1', [], [], undefined, undefined, undefined, 1),
    ).rejects.toThrow('cannot be safely reordered');
  });
});
