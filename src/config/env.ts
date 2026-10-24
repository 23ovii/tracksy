const required = ['VITE_SPOTIFY_CLIENT_ID'] as const;

if (import.meta.env.MODE !== 'test') {
  for (const key of required) {
    if (!import.meta.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }
}

export const env = {
  spotifyClientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  spotifyRedirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI ?? `${location.origin}/callback`,
  posthogKey: import.meta.env.VITE_POSTHOG_KEY,
  posthogHost: import.meta.env.VITE_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
};
