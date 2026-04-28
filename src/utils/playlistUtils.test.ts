import { describe, it, expect } from 'vitest';
import { sortTracks, removeDuplicateTracks } from './playlistUtils';
import type { Track } from '../types';

function makeTrack(overrides: Partial<Track>): Track {
  return {
    id: 'id',
    name: 'Track Name',
    artist: 'Artist Name',
    album: 'Album',
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
});

describe('removeDuplicateTracks', () => {
  it('deduplicates by id', () => {
    const tracks: Track[] = [
      makeTrack({ id: 'x', name: 'One' }),
      makeTrack({ id: 'x', name: 'One' }),
      makeTrack({ id: 'y', name: 'Two' }),
    ];
    const result = removeDuplicateTracks(tracks);
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual(['x', 'y']);
  });

  it('falls back to name+artist key when id is empty', () => {
    const tracks: Track[] = [
      makeTrack({ id: '', name: 'Song', artist: 'Band' }),
      makeTrack({ id: '', name: 'Song', artist: 'Band' }),
      makeTrack({ id: '', name: 'Song', artist: 'Other' }),
    ];
    const result = removeDuplicateTracks(tracks);
    expect(result).toHaveLength(2);
  });

  it('keeps first occurrence when deduplicating', () => {
    const tracks: Track[] = [
      makeTrack({ id: 'dup', name: 'First',  popularity: 10 }),
      makeTrack({ id: 'dup', name: 'Second', popularity: 20 }),
    ];
    const result = removeDuplicateTracks(tracks);
    expect(result[0].name).toBe('First');
  });
});
