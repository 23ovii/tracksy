import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SortCriterion } from '../../utils/playlistUtils';

import SortCriteriaEditor from './SortCriteriaEditor';

describe('SortCriteriaEditor', () => {
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

  it('edits sort fields and directions accessibly', async () => {
    const onChange = vi.fn();
    const criteria: SortCriterion[] = [{ key: 'name', direction: 'asc' }];
    await act(async () => {
      root.render(<SortCriteriaEditor criteria={criteria} onChange={onChange} />);
    });

    const field = container.querySelector<HTMLSelectElement>('[aria-label="Sort field 1"]')!;
    expect(field.value).toBe('name');

    await act(async () => {
      field.value = 'artist';
      field.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(onChange).toHaveBeenLastCalledWith([{ key: 'artist', direction: 'asc' }]);

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[aria-label="Change Title direction to descending"]')!.click();
    });
    expect(onChange).toHaveBeenLastCalledWith([{ key: 'name', direction: 'desc' }]);
  });

  it('adds, reorders, and removes criteria without allowing duplicate fields', async () => {
    const onChange = vi.fn();
    const criteria: SortCriterion[] = [
      { key: 'name', direction: 'asc' },
      { key: 'artist', direction: 'desc' },
    ];
    await act(async () => {
      root.render(<SortCriteriaEditor criteria={[criteria[0]!]} onChange={onChange} />);
    });

    await act(async () => {
      [...container.querySelectorAll<HTMLButtonElement>('button')]
        .find((button) => button.textContent?.includes('Add sort level'))?.click();
    });
    expect(onChange).toHaveBeenLastCalledWith([
      { key: 'name', direction: 'asc' },
      { key: 'artist', direction: 'asc' },
    ]);

    await act(async () => {
      root.render(<SortCriteriaEditor criteria={criteria} onChange={onChange} />);
    });
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[aria-label="Move Artist sort earlier"]')!.click();
    });
    expect(onChange).toHaveBeenLastCalledWith([criteria[1], criteria[0]]);

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[aria-label="Remove Artist sort"]')!.click();
    });
    expect(onChange).toHaveBeenLastCalledWith([criteria[0]]);
  });

  it('does not offer a direction control for discography', async () => {
    await act(async () => {
      root.render(<SortCriteriaEditor criteria={[{ key: 'discography', direction: 'asc' }]} onChange={vi.fn()} />);
    });

    expect(container.querySelector('[aria-label="Discography uses its built-in order"]')).not.toBeNull();
    expect(container.querySelector('[aria-label^="Change Discography direction"]')).toBeNull();
  });
});
