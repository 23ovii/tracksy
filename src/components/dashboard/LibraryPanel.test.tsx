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
        <LibraryPanel playlists={[]} isLoading onRefresh={vi.fn()} onSelect={vi.fn()} />,
      );
    });

    expect(container.textContent).toContain('Loading your library');
    expect(container.querySelector<HTMLButtonElement>('button[aria-label="Refresh playlists"]')?.disabled).toBe(true);
  });

  it('renders the empty library count when there are no playlists', async () => {
    await act(async () => {
      root.render(
        <LibraryPanel playlists={[]} isLoading={false} onRefresh={vi.fn()} onSelect={vi.fn()} />,
      );
    });

    expect(container.textContent).toContain('0 total');
    expect(container.querySelectorAll('button')).toHaveLength(1);
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });
});
