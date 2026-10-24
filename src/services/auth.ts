import type { TokenResponse } from '../types';
import { env } from '../config/env';
import { isRecord } from '../utils/validation';

const SPOTIFY_AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const CLIENT_ID = env.spotifyClientId;
const REDIRECT_URI = env.spotifyRedirectUri;
const SCOPES = 'user-read-private playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private';
const VERIFIER_KEY = 'tracksy_pkce_verifier';
const STATE_KEY = 'tracksy_oauth_state';

function parseTokenResponse(value: unknown): TokenResponse {
  if (!isRecord(value) ||
    typeof value.access_token !== 'string' || value.access_token.trim() === '' ||
    (value.refresh_token !== undefined &&
      (typeof value.refresh_token !== 'string' || value.refresh_token.trim() === '')) ||
    typeof value.expires_in !== 'number' || !Number.isFinite(value.expires_in) || value.expires_in <= 0
  ) {
    throw new Error('Spotify returned an invalid token response.');
  }

  return {
    access_token: value.access_token,
    ...(typeof value.refresh_token === 'string' ? { refresh_token: value.refresh_token } : {}),
    expires_in: value.expires_in,
  };
}

function tokenErrorMessage(value: unknown): string | null {
  return isRecord(value) && typeof value.error_description === 'string'
    ? value.error_description
    : null;
}

function randomString(length = 64): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);
  for (let i = 0; i < length; i += 1) {
    result += charset[values[i]! % charset.length]!;
  }
  return result;
}

async function sha256(message: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
}

export async function buildSpotifyAuthUrl(): Promise<string> {
  if (!CLIENT_ID) {
    throw new Error('Missing VITE_SPOTIFY_CLIENT_ID in environment variables.');
  }

  const codeVerifier = randomString(96);
  const codeChallenge = await createCodeChallenge(codeVerifier);
  const stateValue = randomString(32);

  sessionStorage.setItem(VERIFIER_KEY, codeVerifier);
  sessionStorage.setItem(STATE_KEY, stateValue);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state: stateValue,
    ...(import.meta.env.DEV && { show_dialog: 'true' as const }),
  });

  return `${SPOTIFY_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeSpotifyCode(code: string): Promise<TokenResponse> {
  const codeVerifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!CLIENT_ID || !codeVerifier) {
    throw new Error('Missing PKCE code verifier or Spotify client ID.');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: codeVerifier,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => null);
    throw new Error(tokenErrorMessage(errorData) || 'Failed to exchange Spotify authorization code.');
  }

  const tokenData = parseTokenResponse(await response.json());
  sessionStorage.removeItem(VERIFIER_KEY);
  return tokenData;
}

export async function refreshSpotifyToken(refreshToken: string): Promise<TokenResponse> {
  if (!CLIENT_ID || !refreshToken) {
    throw new Error('Missing refresh token or Spotify client ID.');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Spotify access token.');
  }

  return parseTokenResponse(await response.json());
}

export function verifyOAuthState(returnedState: string | null): boolean {
  const storedState = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);

  if (!storedState || !returnedState) {
    return false;
  }

  return storedState === returnedState;
}
