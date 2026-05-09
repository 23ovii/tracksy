# Tracksy

Sort your Spotify playlists the smart way.

Tracksy is a client-side SPA that connects to Spotify via OAuth, lets you reorder any playlist by title, artist, popularity, date added, duration, or album discography, then writes the new order back to Spotify in one click — no backend required.

## Features

- **6 sort modes** — Title, Artist, Popularity, Date Added, Duration, Discography
- **Discography sort** — groups tracks by artist and album, ranking by catalogue size; singles and sparse albums sink to the bottom
- **Apply to Spotify** — optimised reorder algorithm (full PUT for small playlists, individual moves otherwise)
- **Undo** — 30-second undo window with hover-to-pause countdown
- **Sort history** — restore any of the last 5 orderings per playlist from the history drawer
- **Presets** — save and reapply up to 20 named sort configurations
- **Track filter** — search tracks by title or artist before applying
- **Album art preview** — toggle a thumbnail column in the track table
- **Keyboard shortcuts** — `1–6` pick sort, `d` flips direction, `Enter` applies, `/` opens filter, `?` shows shortcuts
- **Light / dark theme** — system-aware, no flash on load
- **Privacy-first analytics** — PostHog (opt-out available), no cookies, no session recording

## Getting Started

### Prerequisites

- Node.js >= 20
- A [Spotify Developer](https://developer.spotify.com/dashboard) app with a redirect URI set to `http://127.0.0.1:5173/callback`

### Setup

```bash
git clone https://github.com/23ovii/tracksy
cd tracksy
npm install
cp .env.example .env
# Fill in VITE_SPOTIFY_CLIENT_ID in .env
npm run dev
```

Open `http://127.0.0.1:5173` — use `127.0.0.1`, not `localhost`. PKCE stores the code verifier in `sessionStorage`, which is origin-scoped; `localhost` and `127.0.0.1` are different origins on Windows.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SPOTIFY_CLIENT_ID` | Yes | From the Spotify Developer Dashboard |
| `VITE_SPOTIFY_REDIRECT_URI` | No | Defaults to `{origin}/callback` |
| `VITE_POSTHOG_KEY` | No | PostHog API key — omit to disable analytics entirely |
| `VITE_POSTHOG_HOST` | No | PostHog ingest host (default: `https://eu.i.posthog.com`) |

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 19 + TypeScript |
| Bundler | Vite 8 |
| Routing | React Router 7 |
| Styling | CSS variables + inline styles; Tailwind v4 (minimal) |
| Auth | Spotify OAuth 2.0 PKCE (no backend) |
| Analytics | PostHog (privacy-first, opt-out) |
| Deployment | Vercel |

## Project Structure

```
src/
  services/              # auth, spotify API, analytics, presets, sort history
  hooks/                 # useAuth, useSpotify, useTheme, useKeyboardShortcuts
  context/               # AuthContext, ShortcutsOverlayContext
  utils/                 # sortTracks, trackIdentity (duplicate-safe keys)
  components/            # shared UI components
  components/dashboard/  # dashboard-specific sub-components
  pages/                 # Home, Dashboard, Callback, Privacy
  types.ts               # shared TypeScript interfaces
  index.css              # CSS variables (dark + light themes), keyframes
```

## Commands

```bash
npm run dev      # Start dev server at http://127.0.0.1:5173
npm run build    # Production build → /dist
npm run preview  # Preview production build
npm run lint     # ESLint (warnings only)
npm test         # Vitest
```

## License

MIT
