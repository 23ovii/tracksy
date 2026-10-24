import { describe, it, expect } from 'vitest';

import type { Track } from '../types';

import { sortTracks } from './playlistUtils';

function makeTrack(overrides: Partial<Track>): Track {
  return {
    id: 'id',
    uri: '',
    name: 'Track Name',
    artist: 'Artist Name',
    album: 'Album',
    albumYear: 0,
    trackNumber: 0,
    durationMs: 180000,
    addedAt: '2024-01-01T00:00:00Z',
    popularity: 50,
    ...overrides,
  };
}

const fixtures: Track[] = [
  makeTrack({ id: '1', name: 'Banana', artist: 'Zebra',  popularity: 80, addedAt: '2024-03-01T00:00:00Z', durationMs: 300000 }),
  makeTrack({ id: '2', name: 'Apple',  artist: 'Mango',  popularity: 30, addedAt: '2024-01-01T00:00:00Z', durationMs: 120000 }),
  makeTrack({ id: '3', name: 'Cherry', artist: 'Avocado', popularity: 55, addedAt: '2024-06-01T00:00:00Z', durationMs: 240000 }),
];

describe('sortTracks', () => {
  it('sorts by name ascending', () => {
    const result = sortTracks(fixtures, 'name', 'asc');
    expect(result.map((t) => t.name)).toEqual(['Apple', 'Banana', 'Cherry']);
  });

  it('sorts by name descending', () => {
    const result = sortTracks(fixtures, 'name', 'desc');
    expect(result.map((t) => t.name)).toEqual(['Cherry', 'Banana', 'Apple']);
  });

  it('sorts by artist ascending', () => {
    const result = sortTracks(fixtures, 'artist', 'asc');
    expect(result.map((t) => t.artist)).toEqual(['Avocado', 'Mango', 'Zebra']);
  });

  it('sorts by artist descending', () => {
    const result = sortTracks(fixtures, 'artist', 'desc');
    expect(result.map((t) => t.artist)).toEqual(['Zebra', 'Mango', 'Avocado']);
  });

  it('sorts by popularity ascending', () => {
    const result = sortTracks(fixtures, 'popularity', 'asc');
    expect(result.map((t) => t.popularity)).toEqual([30, 55, 80]);
  });

  it('sorts by popularity descending', () => {
    const result = sortTracks(fixtures, 'popularity', 'desc');
    expect(result.map((t) => t.popularity)).toEqual([80, 55, 30]);
  });

  it('sorts by addedAt ascending', () => {
    const result = sortTracks(fixtures, 'addedAt', 'asc');
    expect(result.map((t) => t.addedAt)).toEqual([
      '2024-01-01T00:00:00Z',
      '2024-03-01T00:00:00Z',
      '2024-06-01T00:00:00Z',
    ]);
  });

  it('sorts by addedAt descending', () => {
    const result = sortTracks(fixtures, 'addedAt', 'desc');
    expect(result.map((t) => t.addedAt)).toEqual([
      '2024-06-01T00:00:00Z',
      '2024-03-01T00:00:00Z',
      '2024-01-01T00:00:00Z',
    ]);
  });

  it('sorts by durationMs ascending', () => {
    const result = sortTracks(fixtures, 'durationMs', 'asc');
    expect(result.map((t) => t.durationMs)).toEqual([120000, 240000, 300000]);
  });

  it('sorts by durationMs descending', () => {
    const result = sortTracks(fixtures, 'durationMs', 'desc');
    expect(result.map((t) => t.durationMs)).toEqual([300000, 240000, 120000]);
  });

  it('does not mutate the input array', () => {
    const input = [...fixtures];
    const before = input.map((t) => t.id);
    sortTracks(input, 'name', 'asc');
    expect(input.map((t) => t.id)).toEqual(before);
  });

  it('is stable when values are equal', () => {
    const tied: Track[] = [
      makeTrack({ id: 'a', name: 'Same', popularity: 50 }),
      makeTrack({ id: 'b', name: 'Same', popularity: 50 }),
      makeTrack({ id: 'c', name: 'Same', popularity: 50 }),
    ];
    const result = sortTracks(tied, 'name', 'asc');
    expect(result.map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('applies ordered criteria and each criterion direction independently', () => {
    const tied: Track[] = [
      makeTrack({ id: 'zulu', name: 'Same', artist: 'Zulu' }),
      makeTrack({ id: 'other', name: 'Other', artist: 'Beta' }),
      makeTrack({ id: 'alpha', name: 'Same', artist: 'Alpha' }),
    ];

    expect(sortTracks(tied, [
      { key: 'name', direction: 'asc' },
      { key: 'artist', direction: 'desc' },
    ]).map((track) => track.id)).toEqual(['other', 'zulu', 'alpha']);
  });

  it('uses secondary criteria to break discography ties while keeping single-key ties stable', () => {
    const singles = [
      makeTrack({ id: 'zulu', artist: 'Zulu', album: 'Single Z' }),
      makeTrack({ id: 'alpha', artist: 'Alpha', album: 'Single A' }),
    ];

    expect(sortTracks(singles, 'discography').map((track) => track.id)).toEqual(['zulu', 'alpha']);
    expect(sortTracks(singles, [
      { key: 'discography', direction: 'asc' },
      { key: 'artist', direction: 'asc' },
    ]).map((track) => track.id)).toEqual(['alpha', 'zulu']);
  });

  it('keeps same-named albums with different Spotify identities separate', () => {
    const tracks = [
      makeTrack({
        id: 'other-artist-single',
        artist: 'Other Artist',
        album: 'Shared Title',
        albumId: 'album-other',
        trackNumber: 1,
      }),
      ...[1, 2, 3].map((trackNumber) => makeTrack({
        id: `main-artist-${trackNumber}`,
        artist: 'Main Artist',
        album: 'Shared Title',
        albumId: 'album-main',
        trackNumber,
      })),
    ];

    expect(sortTracks(tracks, 'discography').map((track) => track.id)).toEqual([
      'main-artist-1',
      'main-artist-2',
      'main-artist-3',
      'other-artist-single',
    ]);
  });

  it('falls back to album name and primary artist when Spotify album identity is missing', () => {
    const tracks = [
      makeTrack({ id: 'other-single', artist: 'Other Artist', album: 'Shared Title', trackNumber: 1 }),
      ...[1, 2, 3].map((trackNumber) => makeTrack({
        id: `main-${trackNumber}`,
        artist: 'Main Artist',
        album: 'Shared Title',
        trackNumber,
      })),
    ];

    expect(sortTracks(tracks, 'discography').map((track) => track.id)).toEqual([
      'main-1',
      'main-2',
      'main-3',
      'other-single',
    ]);
  });
});
