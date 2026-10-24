import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LibraryPanel from './LibraryPanel';

describe('LibraryPanel', () => {
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

  it('shows a loading state and disables refresh while loading', async () => {
    await act(async () => {
      root.render(
        <LibraryPanel
          playlists={[]}
          isLoading
          isFetching
          isError={false}
          onRefresh={vi.fn()}
          onSelect={vi.fn()}
        />,
      );
    });

    expect(container.textContent).toContain('Loading your library');
    expect(container.querySelector<HTMLButtonElement>('button[aria-label="Refresh playlists"]')?.disabled).toBe(true);
  });

  it('renders the empty library count when there are no playlists', async () => {
    await act(async () => {
      root.render(
        <LibraryPanel
          playlists={[]}
          isLoading={false}
          isFetching={false}
          isError={false}
          onRefresh={vi.fn()}
          onSelect={vi.fn()}
        />,
      );
    });

    expect(container.textContent).toContain('0 total');
    expect(container.textContent).toContain('No playlists found');
    expect(container.querySelectorAll('button')).toHaveLength(1);
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });

  it('shows a retry action instead of an empty state after a load failure', async () => {
    const onRefresh = vi.fn();
    await act(async () => {
      root.render(
        <LibraryPanel
          playlists={[]}
          isLoading={false}
          isFetching={false}
          isError
          onRefresh={onRefresh}
          onSelect={vi.fn()}
        />,
      );
    });

    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Could not load your playlists');
    expect(container.textContent).not.toContain('No playlists found');
    await act(async () => {
      container.querySelector<HTMLButtonElement>('button:last-of-type')?.click();
    });
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('keeps cached playlists visible and reports a failed refresh', async () => {
    await act(async () => {
      root.render(
        <LibraryPanel
          playlists={[{
            id: 'playlist-1',
            name: 'Cached playlist',
            trackCount: 1,
            color1: '#000000',
            color2: '#ffffff',
          }]}
          isLoading={false}
          isFetching={false}
          isError
          onRefresh={vi.fn()}
          onSelect={vi.fn()}
        />,
      );
    });

    expect(container.querySelector('[role="alert"]')?.textContent)
      .toContain('Showing the last loaded library');
    expect(container.textContent).toContain('Cached playlist');
  });
});
