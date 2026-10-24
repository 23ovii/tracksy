import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SortChips from './SortChips';

describe('SortChips', () => {
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

  it('exposes the selected sort and direction to assistive technology', async () => {
    const onPick = vi.fn();
    await act(async () => {
      root.render(<SortChips sortBy="name" sortDir="asc" onPick={onPick} />);
    });

    const selected = container.querySelector('[aria-pressed="true"]');
    expect(selected?.getAttribute('aria-label')).toBe('Sort by Title, ascending');
    expect(container.querySelectorAll('.tk-chip[aria-pressed="false"]')).toHaveLength(5);

    await act(async () => {
      root.render(<SortChips sortBy="name" sortDir="desc" onPick={onPick} />);
    });

    expect(container.querySelector('[aria-pressed="true"]')?.getAttribute('aria-label'))
      .toBe('Sort by Title, descending');
  });

  it('does not announce a direction for the directionless discography sort', async () => {
    await act(async () => {
      root.render(<SortChips sortBy="discography" sortDir="asc" onPick={vi.fn()} />);
    });

    const selected = container.querySelector('[aria-pressed="true"]');
    expect(selected?.getAttribute('aria-label')).toBe('Sort by Discography');
    expect(selected?.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});
