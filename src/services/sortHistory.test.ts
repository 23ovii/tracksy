import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getHistory, pushHistory, type HistoryEntry } from './sortHistory';

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  const id = overrides.id ?? 'entry-1';
  return {
    id,
    playlistId: overrides.playlistId ?? 'playlist-1',
    appliedAt: overrides.appliedAt ?? 1,
    sortLabel: overrides.sortLabel ?? 'Name',
    trackIdsBefore: overrides.trackIdsBefore ?? ['track-1'],
    trackIdsAfter: overrides.trackIdsAfter ?? ['track-1'],
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('sort history persistence', () => {
  it('stores occurrence keys without duplicating legacy ID arrays', () => {
    pushHistory(entry({
      trackKeysBefore: ['track-1#0'],
      trackKeysAfter: ['track-1#0'],
    }));

    const stored = JSON.parse(localStorage.getItem('tracksy_sort_history_v1')!);
    const savedEntry = stored['playlist-1'][0];

    expect(savedEntry.trackKeysBefore).toEqual(['track-1#0']);
    expect(savedEntry.trackKeysAfter).toEqual(['track-1#0']);
    expect(savedEntry).not.toHaveProperty('trackIdsBefore');
    expect(savedEntry).not.toHaveProperty('trackIdsAfter');
  });

  it('keeps only the 100 most recent entries across playlists', () => {
    for (let index = 0; index < 105; index += 1) {
      pushHistory(entry({
        id: `entry-${index}`,
        playlistId: `playlist-${index}`,
        appliedAt: index,
      }));
    }

    const stored = JSON.parse(localStorage.getItem('tracksy_sort_history_v1')!);
    const entries = Object.values(stored).flat() as HistoryEntry[];

    expect(entries).toHaveLength(100);
    expect(getHistory('playlist-0')).toEqual([]);
    expect(getHistory('playlist-104')).toHaveLength(1);
  });

  it('surfaces storage write failures', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    expect(() => pushHistory(entry())).toThrow('browser storage is unavailable or full');
  });

  it('rejects a single entry that exceeds the storage size bound', () => {
    const oversizedKeys = ['x'.repeat(600_000)];

    expect(() => pushHistory(entry({
      trackKeysBefore: oversizedKeys,
      trackKeysAfter: oversizedKeys,
    }))).toThrow('playlist order exceeds the browser storage limit');
    expect(localStorage.getItem('tracksy_sort_history_v1')).toBeNull();
  });
});
