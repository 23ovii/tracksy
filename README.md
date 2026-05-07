# Tracksy

Sort your Spotify playlists by title, artist, popularity, date added, or duration — then save the new order back to Spotify.

## Setup

```bash
git clone https://github.com/23ovii/tracksy.git
cd tracksy
npm install
cp .env.example .env   # add your Spotify Client ID
npm run dev            # http://127.0.0.1:5173
```

## Environment

| Variable | Value |
|---|---|
| `VITE_SPOTIFY_CLIENT_ID` | From [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) |
| `VITE_SPOTIFY_REDIRECT_URI` | `http://127.0.0.1:5173/callback` for local dev |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the build |
| `npm run lint` | Check for issues |

## Monitoring

Tracksy uses [Sentry](https://sentry.io) for error monitoring, tracing, and session replay. To set up your own free Sentry project:

1. Create a free account at [sentry.io](https://sentry.io) and start a new **React** project.
2. Copy the DSN from **Settings → Projects → [your project] → Client Keys (DSN)**.
3. Add the required env var to your environment:
   - **Local:** add `VITE_SENTRY_DSN=your_dsn_here` to `.env`
   - **Vercel:** add `VITE_SENTRY_DSN` under **Settings → Environment Variables**
4. Optionally set `VITE_APP_VERSION` (e.g. a git SHA or semver string) to link errors to releases in Sentry.

**Source maps** (recommended for readable stack traces):

1. Create an auth token at **Settings → Auth Tokens** in Sentry.
2. Add to your Vercel environment variables (Production only):
   ```
   SENTRY_AUTH_TOKEN=sntrys_...
   SENTRY_ORG=your-org-slug
   SENTRY_PROJECT=your-project-slug
   ```
   The `sentryVitePlugin` in `vite.config.js` uploads source maps automatically on every production build.

Sentry activates whenever `VITE_SENTRY_DSN` is set. It is independent of the analytics opt-out toggle — disabling Vercel Analytics does not disable error reporting. Auth tokens and credentials are scrubbed from all event payloads before they leave the browser.
