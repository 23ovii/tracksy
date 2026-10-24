import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HistoryEntry } from '../services/sortHistory';

import { useDashboardPresetsHistory } from './useDashboardPresetsHistory';

describe('useDashboardPresetsHistory', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let state!: ReturnType<typeof useDashboardPresetsHistory>;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    localStorage.clear();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('updates preset state and scopes history to the selected playlist', async () => {
    function Probe({ playlistId }: { playlistId: string | null }) {
      state = useDashboardPresetsHistory(playlistId);
      return null;
    }

    await act(async () => root.render(<Probe playlistId="playlist-a" />));
    await act(async () => {
      state.saveCurrentPreset('Favorites', [
        { key: 'artist', direction: 'desc' },
        { key: 'addedAt', direction: 'asc' },
      ]);
    });

    const entry: HistoryEntry = {
      id: 'entry-1',
      playlistId: 'playlist-a',
      appliedAt: 1,
      sortLabel: 'Artist',
      trackIdsBefore: ['before'],
      trackIdsAfter: ['after'],
    };
    await act(async () => state.recordHistory(entry));

    expect(state.presets).toHaveLength(1);
    expect(state.presets[0]?.name).toBe('Favorites');
    expect(state.presets[0]?.criteria).toEqual([
      { key: 'artist', direction: 'desc' },
      { key: 'addedAt', direction: 'asc' },
    ]);
    expect(state.history).toEqual([entry]);

    await act(async () => root.render(<Probe playlistId="playlist-b" />));
    expect(state.history).toEqual([]);

    await act(async () => root.render(<Probe playlistId="playlist-a" />));
    expect(state.history).toEqual([entry]);
    await act(async () => state.removeHistory());
    expect(state.history).toEqual([]);
  });

  it('surfaces preset storage errors to the caller', async () => {
    function Probe() {
      state = useDashboardPresetsHistory(null);
      return null;
    }

    await act(async () => root.render(<Probe />));
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    expect(() => state.saveCurrentPreset('Favorites', [{ key: 'artist', direction: 'desc' }]))
      .toThrow('Storage unavailable');
  });
});
