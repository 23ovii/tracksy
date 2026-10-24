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
