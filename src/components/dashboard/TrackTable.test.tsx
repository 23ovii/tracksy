import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Track } from '../../types';

import TrackTable from './TrackTable';

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count, estimateSize }: { count: number; estimateSize: () => number }) => ({
    getVirtualItems: () => Array.from({ length: count }, (_, index) => ({
      index,
      start: index * estimateSize(),
    })),
    getTotalSize: () => count * estimateSize(),
  }),
}));

const tracks: Track[] = [
  {
    id: 'track-1',
    uri: 'spotify:track:track-1',
    name: 'First track',
    artist: 'Artist',
    album: 'Album',
    albumYear: 2020,
    trackNumber: 1,
    durationMs: 180000,
    addedAt: '',
    popularity: 50,
  },
  {
    id: 'track-2',
    uri: 'spotify:track:track-2',
    name: 'Second track',
    artist: 'Artist',
    album: 'Album',
    albumYear: 2020,
    trackNumber: 2,
    durationMs: 180000,
    addedAt: '',
    popularity: 50,
  },
];

describe('TrackTable empty states', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  function renderTable(overrides: Partial<Parameters<typeof TrackTable>[0]> = {}) {
    return (
      <TrackTable
        sorted={[]}
        sortBy="name"
        sortKey={0}
        isLoading={false}
        isError={false}
        isEmptyPlaylist
        accent="#1db954"
        showPreview
        onTogglePreview={vi.fn()}
        {...overrides}
      />
    );
  }

  it('explains when a playlist has no tracks', async () => {
    await act(async () => root.render(renderTable()));

    expect(container.querySelector('[role="status"]')?.textContent)
      .toContain('This playlist has no tracks yet');
  });

  it('explains when a filter has no matching tracks', async () => {
    await act(async () => root.render(renderTable({
      filterQuery: 'missing',
      isEmptyPlaylist: false,
    })));

    expect(container.querySelector('[role="status"]')?.textContent)
      .toContain('No tracks match your filter');
  });

  it('does not call a playlist empty when only unsupported tracks were loaded', async () => {
    await act(async () => root.render(renderTable({ isEmptyPlaylist: false })));

    expect(container.querySelector('[role="status"]')?.textContent)
      .toContain('No sortable tracks are available');
  });

  it('keeps loading and error states distinct from the empty state', async () => {
    await act(async () => root.render(renderTable({ isLoading: true })));
    expect(container.textContent).toContain('Loading tracks');
    expect(container.textContent).not.toContain('no tracks yet');
    expect(container.querySelectorAll('[role="columnheader"]')).toHaveLength(5);

    await act(async () => root.render(renderTable({ isError: true })));
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it('hides the diff summary and preview toggle when all positions are unchanged', async () => {
    await act(async () => root.render(renderTable({
      sorted: tracks,
      diffMap: new Map([[tracks[0]!, 0], [tracks[1]!, 0]]),
    })));

    expect(container.textContent).not.toContain('moved up');
    expect(container.querySelector('button')).toBeNull();
  });

  it('shows the diff summary and preview toggle when tracks have moved', async () => {
    await act(async () => root.render(renderTable({
      sorted: tracks,
      diffMap: new Map([[tracks[0]!, 1], [tracks[1]!, -1]]),
    })));

    expect(container.textContent).toContain('moved up');
    expect(container.textContent).toContain('moved down');
    expect(container.querySelector('button')?.textContent).toContain('Hide preview');
  });

  it('exposes playlist tracks as a table with indexed rows and column headers', async () => {
    await act(async () => root.render(renderTable({ sorted: tracks })));

    const table = container.querySelector('[role="table"]');
    expect(table?.getAttribute('aria-label')).toBe('Playlist tracks');
    expect(table?.getAttribute('aria-rowcount')).toBe('3');
    expect(table?.getAttribute('aria-colcount')).toBe('5');
    expect(container.querySelectorAll('[role="columnheader"]')).toHaveLength(5);
    expect(container.querySelectorAll('[role="row"]')).toHaveLength(3);
    expect(container.querySelector('[role="row"][aria-rowindex="2"] [role="cell"]')?.textContent).toBe('01');
    expect(container.querySelector('[role="row"][aria-rowindex="3"] [role="cell"]')?.textContent).toBe('02');
  });

  it('includes the delta column in table semantics when the movement preview is shown', async () => {
    await act(async () => root.render(renderTable({
      sorted: tracks,
      diffMap: new Map([[tracks[0]!, 1], [tracks[1]!, -1]]),
    })));

    expect(container.querySelector('[role="table"]')?.getAttribute('aria-colcount')).toBe('6');
    expect(container.querySelectorAll('[role="columnheader"]')).toHaveLength(6);
    expect(container.querySelectorAll('[role="row"][aria-rowindex="2"] [role="cell"]')).toHaveLength(6);
  });
});
