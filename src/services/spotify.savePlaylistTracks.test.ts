import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Track } from '../types';

import { savePlaylistTracks } from './spotify';

function tracks(count: number): Track[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `track-${index}`,
    uri: `spotify:track:track-${index}`,
    name: `Track ${index}`,
    artist: 'Artist',
    album: 'Album',
    albumYear: 2020,
    trackNumber: index + 1,
    durationMs: 180_000,
    addedAt: '',
    popularity: 50,
  }));
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('savePlaylistTracks', () => {
  it('does not write when the requested order is unchanged', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch');
    const original = tracks(3);

    await expect(savePlaylistTracks('token', 'playlist', original, [...original])).resolves.toEqual({ moves: 0 });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('replaces a small playlist with one PUT when most tracks move', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));
    const original = tracks(4);
    const sorted = [...original].reverse();

    await expect(savePlaylistTracks('token', 'playlist', original, sorted)).resolves.toEqual({ moves: 4 });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0]?.[1]?.method).toBe('PUT');
    expect(JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body))).toEqual({
      uris: sorted.map((track) => track.uri),
    });
  });

  it('uses individual reorder requests for playlists over 100 tracks', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));
    const original = tracks(101);
    const sorted = [original[1]!, original[0]!, ...original.slice(2)];

    await expect(savePlaylistTracks('token', 'playlist', original, sorted)).resolves.toEqual({ moves: 1 });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body))).toEqual({
      range_start: 1,
      insert_before: 0,
      range_length: 1,
    });
  });

  it('stops before issuing another request when aborted between moves', async () => {
    const controller = new AbortController();
    const original = tracks(101);
    const sorted = [original[1]!, original[2]!, original[0]!, ...original.slice(3)];
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      controller.abort();
      return new Response(null, { status: 200 });
    });

    await expect(
      savePlaylistTracks('token', 'playlist', original, sorted, undefined, undefined, controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('waits for Retry-After after a 429 and retries the request', async () => {
    vi.useFakeTimers();
    const mockFetch = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 429, headers: { 'Retry-After': '2' } }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const original = tracks(4);
    const sorted = [...original].reverse();

    const resultPromise = savePlaylistTracks('token', 'playlist', original, sorted);
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(2_000);

    await expect(resultPromise).resolves.toEqual({ moves: 4 });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('caps exponential retries and fails after five retry attempts', async () => {
    vi.useFakeTimers();
    const onRateLimit = vi.fn();
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 429, headers: { 'Retry-After': '5' } }),
    );
    const original = tracks(4);
    const sorted = [...original].reverse();
    const resultPromise = savePlaylistTracks('token', 'playlist', original, sorted, undefined, onRateLimit);
    void resultPromise.catch(() => {});

    await vi.runAllTimersAsync();

    await expect(resultPromise).rejects.toThrow('rate limit exceeded after 5 retries');
    expect(mockFetch).toHaveBeenCalledTimes(6);
    expect(onRateLimit.mock.calls.map(([seconds]) => seconds)).toEqual([5, 10, 20, 40, 60]);
  });

  it('aborts during a rate-limit wait without retrying', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 429, headers: { 'Retry-After': '30' } }),
    );
    const original = tracks(4);
    const sorted = [...original].reverse();
    const resultPromise = savePlaylistTracks(
      'token',
      'playlist',
      original,
      sorted,
      undefined,
      undefined,
      controller.signal,
    );
    void resultPromise.catch(() => {});

    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledOnce());
    controller.abort();

    await expect(resultPromise).rejects.toMatchObject({ name: 'AbortError' });
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('does not retry earlier than a Retry-After longer than the maximum wait', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 429, headers: { 'Retry-After': '120' } }),
    );
    const original = tracks(4);
    const sorted = [...original].reverse();

    await expect(savePlaylistTracks('token', 'playlist', original, sorted))
      .rejects.toThrow('exceeding the 60-second maximum wait');
    expect(mockFetch).toHaveBeenCalledOnce();
  });
});
