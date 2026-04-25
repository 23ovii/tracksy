# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Tracksy is a React + Vite SPA for Spotify playlist sorting. It authenticates users via Spotify OAuth PKCE (no backend), loads their owned playlists, sorts tracks client-side by BPM, energy, popularity, date added, or duration, and writes the new order back to Spotify. Deployed to Vercel.

## Git Workflow

Always create a branch before making changes:

```bash
git checkout -b feat/description   # new feature
git checkout -b fix/description    # bug fix
git checkout -b chore/description  # tooling / docs / cleanup
```

Push and open a PR into `main`. Never commit directly to `main`.

## Commands

```bash
npm run dev       # Dev server at http://127.0.0.1:5173
npm run build     # Production build to /dist
npm run preview   # Preview production build locally
npm run lint      # ESLint — check for issues (warnings only, not blocking)
```

## Environment Variables

Copy `.env.example` to `.env`. Required vars:

```
VITE_SPOTIFY_CLIENT_ID=     # From Spotify Developer Dashboard
VITE_SPOTIFY_REDIRECT_URI=  # http://127.0.0.1:5173/callback for local dev
```

Use `http://127.0.0.1:5173/callback` — not `localhost` — to avoid PKCE sessionStorage issues on Windows (different origins = separate sessionStorage = "Missing code verifier" error).

Scopes are hardcoded in `src/services/auth.js`:
`playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private`

## Tooling

- **TypeScript** — `tsconfig.json` with `allowJs: true`, `checkJs: false`, strict mode OFF. Existing files are `.jsx`/`.js`. New files can be `.ts`/`.tsx`. `any` is fine.
- **ESLint** — flat config in `eslint.config.js` (ESLint v9). Warnings only, never blocking. `console.log` is allowed.
- **Prettier** — `.prettierrc`. Run manually, not enforced on commit.
- **No testing framework** — Vitest was removed. Tests will be added later.
- **No pre-commit hooks** — Husky was removed intentionally to avoid friction while learning.

## Architecture

### Auth flow
PKCE OAuth in `src/services/auth.js`. Code verifier stored in `sessionStorage`, swapped for tokens on `/callback`, then deleted. Auth state (`token`, `refreshToken`, `expiresAt`) persisted to `localStorage` under key `tracksy_auth_state`. `AuthContext` (`src/context/AuthContext.jsx`) manages token refresh 1 minute before expiry via `setTimeout`. Access via `useAuth()` hook.

### Data fetching
`src/hooks/useSpotify.jsx` manages all state: playlists, tracks, selected playlist, loading flags. Calls `src/services/spotify.js` for every Spotify API call.

- Playlists load on dashboard mount — only playlists owned by the authenticated user (`owner.id === user.id`) are shown, not followed/saved playlists.
- Tracks load immediately when a playlist is selected (`setSelectedPlaylist` + `setTracks` fire before audio features).
- Audio features (BPM, energy) are fetched in the background in a separate try/catch after tracks render. If the endpoint fails (Spotify deprecated it in late 2024), tracks still show with BPM/energy defaulting to `0`.

### Routing
`App.jsx` defines three routes: `/` (Home), `/dashboard`, `/callback`. `BrowserRouter` + `AuthProvider` wrap the app in `main.jsx`. `@vercel/analytics` and `@vercel/speed-insights` are mounted in `App.jsx`.

### Sort flow
`Dashboard.jsx` maintains `sortBy` / `sortDir` state. `sortTracks(tracks, by, dir)` in `src/utils/playlistUtils.js` returns a sorted copy without mutating state. Clicking "Apply to Spotify" shows `SortProgress` (1.8s animation) then calls `savePlaylistTracks()`, which uses `PUT /v1/playlists/{id}/tracks` for the first 100 URIs and `POST` for each subsequent batch of 100.

### Spotify API calls (`src/services/spotify.js`)
- `fetchAllPages(url, token)` — follows `next` links to paginate any endpoint
- `getAudioFeatures(ids, token)` — batches in groups of 100, merges BPM + energy into tracks
- `savePlaylistTracks(id, uris, token)` — PUT first batch, POST remaining batches
- `playlistColors(id)` — deterministic gradient pair from a palette based on a hash of the playlist ID (Spotify doesn't return cover colors)

### Sort options (`src/utils/playlistUtils.js`)
`SORT_OPTIONS` array defines 7 sort keys: `bpm`, `energy`, `popularity`, `title`, `artist`, `added`, `duration`. `sortTracks(tracks, by, dir)` handles all of them.

### Components
| Component | Description |
|---|---|
| `PlaylistGrid` | 8-per-page paginated grid with dot indicators and arrow buttons |
| `PlaylistSlider` | Horizontal carousel, scrolls 3 cards per arrow click |
| `PlaylistCard` | Gradient cover art with deterministic colors, selected state with color-matched border |
| `TrackItem` | 7-column row: index, title+album, artist, BPM, MiniWave, popularity, duration |
| `MiniWave` | 8-bar animated energy visualization |
| `SortProgress` | `requestAnimationFrame` progress bar 0→100% over 1.8s, fires `onDone` callback |
| `Navbar` | Music note SVG logo, green glow, NavLink pill styles |

### Styling
CSS variables (`--bg`, `--surface`, `--surface2`, `--surface3`, `--border`, `--border2`, `--green`, `--text`, `--text-2`, `--text-3`, `--nav-h`) defined in `src/index.css`. Components use inline styles referencing those variables. Tailwind is present but used minimally. Font: Inter via Google Fonts.

Note: emojis in playlist names are not visible — Inter (Google Fonts) claims the emoji unicode range, preventing system emoji font fallback. Known issue, left unresolved.

### Deployment
Vercel via Git integration. Every push to `main` triggers an automatic production deployment. `vercel.json` is present. Environment variables are set in the Vercel dashboard.

**Vite base path:** `base: '/'` — Vercel handles routing.  
**Dev host:** `server: { host: '127.0.0.1' }` in `vite.config.js` — avoids IPv6 binding issues on Windows.
