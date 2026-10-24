import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SortProgress from './SortProgress';

describe('SortProgress', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let rootMounted: boolean;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    rootMounted = true;
  });

  afterEach(async () => {
    if (rootMounted) await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('exposes progress values and announces rate-limit status', async () => {
    await act(async () => {
      root.render(
        <SortProgress
          active
          progress={42.4}
          label="Name"
          onDone={vi.fn()}
          rateLimitMsg="Waiting for Spotify"
        />,
      );
    });

    const progress = container.querySelector('[role="progressbar"]');
    expect(progress?.getAttribute('aria-valuemin')).toBe('0');
    expect(progress?.getAttribute('aria-valuemax')).toBe('100');
    expect(progress?.getAttribute('aria-valuenow')).toBe('42');
    expect(progress?.getAttribute('aria-label')).toBe('Sorting by Name');
    expect(container.querySelector('[role="status"]')?.textContent).toBe('Waiting for Spotify');
  });

  it('does not call onDone after unmount', async () => {
    const onDone = vi.fn();

    await act(async () => {
      root.render(<SortProgress active progress={100} label="Name" onDone={onDone} />);
    });

    await act(async () => root.unmount());
    rootMounted = false;
    await act(async () => vi.advanceTimersByTime(300));

    expect(onDone).not.toHaveBeenCalled();
  });
});
