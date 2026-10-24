import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { exchangeSpotifyCode, refreshSpotifyToken, verifyOAuthState } from './auth';

const STATE_KEY = 'tracksy_oauth_state';
const VERIFIER_KEY = 'tracksy_pkce_verifier';

vi.mock('../config/env', () => ({
  env: {
    spotifyClientId: 'test-client',
    spotifyRedirectUri: 'http://127.0.0.1:5173/callback',
  },
}));

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('verifyOAuthState', () => {
  it('returns true and clears the state when it matches', () => {
    sessionStorage.setItem(STATE_KEY, 'expected-state');

    expect(verifyOAuthState('expected-state')).toBe(true);
    expect(sessionStorage.getItem(STATE_KEY)).toBeNull();
  });

  it('returns false and clears the state when it does not match', () => {
    sessionStorage.setItem(STATE_KEY, 'expected-state');

    expect(verifyOAuthState('different-state')).toBe(false);
    expect(sessionStorage.getItem(STATE_KEY)).toBeNull();
  });

  it('returns false when there is no stored state', () => {
    expect(verifyOAuthState('returned-state')).toBe(false);
  });
});

describe('Spotify token responses', () => {
  it('rejects an authorization response without a valid access token', async () => {
    sessionStorage.setItem(VERIFIER_KEY, 'verifier');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ access_token: '', expires_in: 3600 }), { status: 200 }),
    ));

    await expect(exchangeSpotifyCode('code')).rejects.toThrow('invalid token response');
    expect(sessionStorage.getItem(VERIFIER_KEY)).toBe('verifier');
  });

  it('rejects a response without an expiry', async () => {
    sessionStorage.setItem(VERIFIER_KEY, 'verifier');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ access_token: 'token' }), { status: 200 }),
    ));

    await expect(exchangeSpotifyCode('code')).rejects.toThrow('invalid token response');
  });

  it('uses a fallback message when an OAuth error body is not an object', async () => {
    sessionStorage.setItem(VERIFIER_KEY, 'verifier');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('null', { status: 400 }),
    ));

    await expect(exchangeSpotifyCode('code'))
      .rejects.toThrow('Failed to exchange Spotify authorization code.');
  });

  it('rejects a refresh response with an invalid expiry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ access_token: 'token', expires_in: Infinity }), { status: 200 }),
    ));

    await expect(refreshSpotifyToken('refresh-token')).rejects.toThrow('invalid token response');
  });

  it('accepts a valid refresh response that omits the rotated refresh token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ access_token: 'new-token', expires_in: 3600 }), { status: 200 }),
    ));

    await expect(refreshSpotifyToken('refresh-token')).resolves.toEqual({
      access_token: 'new-token',
      expires_in: 3600,
    });
  });
});
