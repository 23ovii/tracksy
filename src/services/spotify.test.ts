import { describe, it, expect } from 'vitest';
import { playlistColors } from './spotify';

const COLOR_PAIRS_LENGTH = 14;

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
