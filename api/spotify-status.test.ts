import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from '@vercel/edge-config';

import handler from './spotify-status';

vi.mock('@vercel/edge-config', () => ({
  get: vi.fn(),
}));

const mockedGet = vi.mocked(get);

describe('spotify-status endpoint', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('returns the configured status without caching it', async () => {
    mockedGet.mockImplementation(async (key) => (key === 'spotify_down' ? true : 'Scheduled maintenance'));

    const response = await handler();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({
      isDown: true,
      message: 'Scheduled maintenance',
    });
  });

  it('uses healthy defaults when status values are missing', async () => {
    mockedGet.mockResolvedValue(null);

    const response = await handler();

    await expect(response.json()).resolves.toEqual({ isDown: false, message: '' });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('fails open with a healthy response when Edge Config is unavailable', async () => {
    mockedGet.mockRejectedValue(new Error('Edge Config unavailable'));

    const response = await handler();

    await expect(response.json()).resolves.toEqual({ isDown: false, message: '' });
    expect(response.status).toBe(200);
  });
});
