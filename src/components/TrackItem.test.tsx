import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Track } from '../types';

import TrackItem from './TrackItem';

const initialTrack: Track = {
  id: 'track-1',
  uri: 'spotify:track:track-1',
  name: 'Original title',
  artist: 'Original artist',
  album: 'Original album',
  albumYear: 2020,
  trackNumber: 1,
  durationMs: 60_000,
  addedAt: '2020-01-01T00:00:00Z',
  popularity: 20,
};

describe('TrackItem', () => {
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

  it('rerenders displayed metadata when a track keeps its id but its data changes', async () => {
    await act(async () => {
      root.render(<TrackItem track={initialTrack} index={0} sortBy="name" />);
    });

    const refreshedTrack: Track = {
      ...initialTrack,
      name: 'Updated title',
      artist: 'Updated artist',
      album: 'Updated album',
      popularity: 85,
      durationMs: 125_000,
    };
    await act(async () => {
      root.render(<TrackItem track={refreshedTrack} index={0} sortBy="name" />);
    });

    expect(container.textContent).toContain('Updated title');
    expect(container.textContent).toContain('Updated artist');
    expect(container.textContent).toContain('Updated album');
    expect(container.textContent).toContain('85');
    expect(container.textContent).toContain('2:05');
    expect(container.textContent).not.toContain('Original title');
  });
});
