# Tracksy

Sort your Spotify playlists the smart way.

Tracksy is a client-side SPA that connects to Spotify via OAuth, lets you reorder playlists you own by title, artist, popularity, date added, duration, or discography, then writes the new order back to Spotify. Combine and reorder sort criteria to break ties, and save those configurations as presets. Playlist data is processed in the browser and is not stored by Tracksy.

## Features

- **6 sort criteria** — combine Title, Artist, Popularity, Date Added, Duration, and Discography in an ordered list; set each direction, with Discography using its built-in order
- **Discography sort** — groups tracks by artist and album, ranking by catalogue size; singles and sparse albums sink to the bottom
- **Apply to Spotify** — optimised reorder algorithm (full PUT for small playlists, individual moves otherwise)
- **Safe reorder checks** — playlists containing local or unavailable tracks are read-only because Spotify reorder positions cannot be preserved safely
- **Undo** — 30-second undo window with hover-to-pause countdown
- **Sort history** — restore any of the last 5 orderings per playlist from the history drawer
- **Presets** — save and reapply up to 20 named sort configurations
- **Track filter** — search tracks by title or artist before applying
- **Movement preview** — compare each track's position before applying a new order
- **Keyboard shortcuts** — `1–6` pick the primary sort, `d` flips its direction, `Enter` applies, `/` opens filter, `?` shows shortcuts
- **Light / dark theme** — system-aware, no flash on load
- **Privacy-first analytics** — PostHog (opt-out available), no cookies, no session recording

## Getting Started

### Prerequisites

- Node.js >= 20.19.0
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
  api/                   # React Query playlist queries, reorder mutation, query client
  auth/                  # AuthProvider and useAuth
  config/                # validated environment configuration
  services/              # Spotify API, OAuth, analytics, presets, sort history
  hooks/                 # reorder operation, dashboard history, theme, shortcuts, status
  context/               # ShortcutsOverlayContext
  utils/                 # sortTracks, trackIdentity (duplicate-safe keys)
  components/            # shared UI components
  components/dashboard/  # dashboard-specific sub-components
  pages/                 # Home, Dashboard, Callback, Privacy
  styles/                # design tokens and Tailwind entry point
  types.ts               # shared TypeScript interfaces
  index.css              # CSS variables (dark + light themes), keyframes
api/                     # Spotify status Vercel function
```

## Commands

```bash
npm run dev      # Start dev server at http://127.0.0.1:5173
npm run build    # Production build → /dist
npm run preview  # Preview production build
npm run validate # TypeScript, ESLint, and Vitest
npm run lint     # ESLint
npm test         # Vitest
```

GitHub Actions runs `npm run validate` and `npm run build` for pull requests and pushes to `main`.

### Regenerate the Open Graph image

`npm run generate:og` requires an installed Chrome or Edge browser. Set `PUPPETEER_EXECUTABLE_PATH` (or `CHROME_BIN`) to the browser executable before running it:

```powershell
$env:PUPPETEER_EXECUTABLE_PATH = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm run generate:og
```

On macOS or Linux, use the browser's executable path in `PUPPETEER_EXECUTABLE_PATH`.

## License

MIT
