import { act } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Playlist } from '../../types';

import SorterHeader from './SorterHeader';

vi.mock('focus-trap-react', () => ({
  FocusTrap: ({ children }: { children: ReactNode }) => children,
}));

const playlist: Playlist = {
  id: 'playlist-1',
  name: 'Test playlist',
  trackCount: 1,
  color1: '#123456',
  color2: '#654321',
};

describe('SorterHeader history drawer Escape handling', () => {
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

  it('closes the history drawer without bubbling Escape to dashboard navigation', async () => {
    const onWindowKeyDown = vi.fn();
    const onBack = vi.fn();
    window.addEventListener('keydown', onWindowKeyDown);

    await act(async () => {
      root.render(
        <SorterHeader
          selectedPlaylist={playlist}
          totalMs={0}
          applying={false}
          applied={false}
          canWrite
          accent={playlist.color1}
          accent2={playlist.color2}
          historyEntries={[{
            id: 'entry-1',
            playlistId: playlist.id,
            appliedAt: Date.now(),
            sortLabel: 'Name',
            trackKeysBefore: ['track#0'],
            trackKeysAfter: ['track#0'],
          }]}
          onBack={onBack}
          onApply={vi.fn()}
          onRestore={vi.fn()}
          onClearHistory={vi.fn()}
        />,
      );
    });

    await act(async () => {
      [...container.querySelectorAll('button')]
        .find((button) => button.textContent?.includes('History'))!
        .click();
    });
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();

    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    await act(async () => {
      document.dispatchEvent(escape);
    });

    expect(escape.defaultPrevented).toBe(true);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(onWindowKeyDown).not.toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();

    window.removeEventListener('keydown', onWindowKeyDown);
  });
});
