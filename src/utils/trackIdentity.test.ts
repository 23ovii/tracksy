import { describe, expect, it } from 'vitest';
import type { Track } from '../types';
import {
  buildTrackOccurrenceKeys,
  mapTracksByOccurrenceKey,
  restoreTracksFromKeys,
} from './trackIdentity';

function makeTrack(id: string, name = id): Track {
  return {
    id,
    uri: `spotify:track:${id}`,
    name,
    artist: 'Artist',
    album: 'Album',
    durationMs: 180000,
    addedAt: '2024-01-01T00:00:00Z',
    popularity: 50,
  };
}

describe('track occurrence identity', () => {
  it('creates stable occurrence keys for duplicate tracks', () => {
    const tracks = [makeTrack('a'), makeTrack('b'), makeTrack('a', 'A duplicate')];

    expect(buildTrackOccurrenceKeys(tracks)).toEqual(['a#0', 'b#0', 'a#1']);
  });

  it('maps occurrence keys back to distinct duplicate objects', () => {
    const first = makeTrack('a', 'First');
    const second = makeTrack('a', 'Second');
    const map = mapTracksByOccurrenceKey([first, second]);

    expect(map.get('a#0')).toBe(first);
    expect(map.get('a#1')).toBe(second);
  });

  it('restores duplicate tracks by exact occurrence key order', () => {
    const first = makeTrack('a', 'First');
    const second = makeTrack('a', 'Second');
    const third = makeTrack('b', 'Third');

    expect(restoreTracksFromKeys([first, second, third], ['a#1', 'b#0', 'a#0'])).toEqual([
      second,
      third,
      first,
    ]);
  });

  it('returns null instead of truncating when history is stale', () => {
    const tracks = [makeTrack('a'), makeTrack('b')];

    expect(restoreTracksFromKeys(tracks, ['a#0'])).toBeNull();
    expect(restoreTracksFromKeys(tracks, ['a#0', 'missing#0'])).toBeNull();
  });

  it('supports legacy id-only history without dropping tracks', () => {
    const first = makeTrack('a', 'First');
    const second = makeTrack('a', 'Second');
    const third = makeTrack('b', 'Third');

    expect(restoreTracksFromKeys([first, second, third], ['a', 'b', 'a'])).toEqual([
      first,
      third,
      second,
    ]);
  });
});
