import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useKeyboardShortcuts } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
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

  it('does not prevent native Enter activation or trigger shortcuts inside interactive controls', async () => {
    const onEnter = vi.fn();
    function Probe() {
      useKeyboardShortcuts({ enter: onEnter }, () => false);
      return (
        <button>
          <span data-testid="button-child">Activate</span>
        </button>
      );
    }

    await act(async () => root.render(<Probe />));
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });

    await act(async () => {
      container.querySelector('[data-testid="button-child"]')!.dispatchEvent(event);
    });

    expect(onEnter).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('runs and consumes Enter when focus is outside interactive controls', async () => {
    const onEnter = vi.fn();
    function Probe() {
      useKeyboardShortcuts({ enter: onEnter }, () => false);
      return <div data-testid="page-content" tabIndex={-1}>Page</div>;
    }

    await act(async () => root.render(<Probe />));
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });

    await act(async () => {
      container.querySelector('[data-testid="page-content"]')!.dispatchEvent(event);
    });

    expect(onEnter).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });
});
