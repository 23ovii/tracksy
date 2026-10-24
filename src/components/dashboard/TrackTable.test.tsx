import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TrackTable from './TrackTable';

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

    await act(async () => root.render(renderTable({ isError: true })));
    expect(container.querySelector('[role="status"]')).toBeNull();
  });
});
