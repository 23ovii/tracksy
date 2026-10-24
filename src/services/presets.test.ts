import { beforeEach, describe, expect, it } from 'vitest';

import { listPresets, savePreset } from './presets';

describe('presets', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips ordered sort criteria', () => {
    const preset = {
      id: 'preset-1',
      name: 'Title then artist',
      criteria: [
        { key: 'name' as const, direction: 'asc' as const },
        { key: 'artist' as const, direction: 'desc' as const },
      ],
      createdAt: 1,
    };

    savePreset(preset);

    expect(listPresets()).toEqual([preset]);
  });

  it('migrates existing single-sort presets', () => {
    localStorage.setItem('tracksy_presets_v1', JSON.stringify([{
      id: 'legacy',
      name: 'Old preset',
      sortBy: 'artist',
      sortDir: 'desc',
      createdAt: 1,
    }, {
      id: 'legacy-discography',
      name: 'Old discography preset',
      sortBy: 'discography',
      sortDir: 'desc',
      createdAt: 2,
    }]));

    expect(listPresets()[0]?.criteria).toEqual([
      { key: 'artist', direction: 'desc' },
    ]);
    expect(listPresets()[1]?.criteria).toEqual([
      { key: 'discography', direction: 'asc' },
    ]);
  });

  it('discards criteria with invalid or duplicate keys', () => {
    localStorage.setItem('tracksy_presets_v1', JSON.stringify([{
      id: 'invalid',
      name: 'Invalid preset',
      criteria: [
        { key: 'name', direction: 'asc' },
        { key: 'name', direction: 'desc' },
      ],
      createdAt: 1,
    }]));

    expect(listPresets()).toEqual([]);
  });
});
