# CLAUDE.md

Guidance for Claude Code working in this repo.

## What This Is

Tracksy: React + Vite SPA for Spotify playlist sorting. Spotify OAuth PKCE (no backend), loads owned playlists, sorts tracks client-side by BPM, energy, popularity, date added, or duration, writes new order back to Spotify. Deployed to Vercel.

## Git Workflow

Branch before changes:

```bash
git checkout -b feat/description   # new feature
git checkout -b fix/description    # bug fix
git checkout -b chore/description  # tooling / docs / cleanup
```

Push + open PR into `main`. Never commit directly to `main`.

## Commands

```bash
npm run dev       # Dev server at http://127.0.0.1:5173
npm run build     # Production build to /dist
npm run preview   # Preview production build locally
npm run lint      # ESLint — check for issues (warnings only, not blocking)
```

## Environment Variables

Copy `.env.example` to `.env`. Required:

```
VITE_SPOTIFY_CLIENT_ID=     # From Spotify Developer Dashboard
VITE_SPOTIFY_REDIRECT_URI=  # http://127.0.0.1:5173/callback for local dev
```

Use `http://127.0.0.1:5173/callback` — not `localhost` — avoids PKCE sessionStorage issues on Windows (different origins = separate sessionStorage = "Missing code verifier" error).

Scopes hardcoded in `src/services/auth.js`:
`playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private`

## Tooling

- **TypeScript** — `tsconfig.json` with `allowJs: true`, `checkJs: false`, strict OFF. Existing files `.jsx`/`.js`. New files can be `.ts`/`.tsx`. `any` is fine.
- **ESLint** — flat config in `eslint.config.js` (ESLint v9). Warnings only, never blocking. `console.log` allowed.
- **Prettier** — `.prettierrc`. Run manually, not enforced on commit.
- **No testing framework** — Vitest removed. Tests added later.
- **No pre-commit hooks** — Husky removed to avoid friction while learning.

## Architecture

### Auth flow
PKCE OAuth in `src/services/auth.js`. Code verifier in `sessionStorage`, swapped for tokens on `/callback`, then deleted. Auth state (`token`, `refreshToken`, `expiresAt`) persisted to `localStorage` under key `tracksy_auth_state`. `AuthContext` (`src/context/AuthContext.jsx`) refreshes token 1 min before expiry via `setTimeout`. Access via `useAuth()`.

### Data fetching
`src/hooks/useSpotify.jsx` manages all state: playlists, tracks, selected playlist, loading flags. Calls `src/services/spotify.js` for every Spotify API call.

- Playlists load on dashboard mount — only user-owned playlists shown (`owner.id === user.id`), not followed/saved.
- Tracks load immediately on playlist select (`setSelectedPlaylist` + `setTracks` fire before audio features).
- Audio features (BPM, energy) fetched in background in separate try/catch after tracks render. If endpoint fails (Spotify deprecated late 2024), tracks show with BPM/energy defaulting to `0`.

### Routing
`App.jsx`: three routes `/` (Home), `/dashboard`, `/callback`. `BrowserRouter` + `AuthProvider` wrap app in `main.jsx`. `@vercel/analytics` and `@vercel/speed-insights` mounted in `App.jsx`.

### Sort flow
`Dashboard.jsx` maintains `sortBy` / `sortDir` state. `sortTracks(tracks, by, dir)` in `src/utils/playlistUtils.js` returns sorted copy without mutating state. "Apply to Spotify" shows `SortProgress` (1.8s animation) then calls `savePlaylistTracks()` — `PUT /v1/playlists/{id}/tracks` for first 100 URIs, `POST` for each subsequent batch of 100.

### Spotify API calls (`src/services/spotify.js`)
- `fetchAllPages(url, token)` — follows `next` links to paginate any endpoint
- `getAudioFeatures(ids, token)` — batches in groups of 100, merges BPM + energy into tracks
- `savePlaylistTracks(id, uris, token)` — PUT first batch, POST remaining batches
- `playlistColors(id)` — deterministic gradient pair from palette hashed from playlist ID (Spotify doesn't return cover colors)

### Sort options (`src/utils/playlistUtils.js`)
`SORT_OPTIONS`: 7 keys: `bpm`, `energy`, `popularity`, `title`, `artist`, `added`, `duration`. `sortTracks(tracks, by, dir)` handles all.

### Components
| Component | Description |
|---|---|
| `PlaylistGrid` | 8-per-page paginated grid, dot indicators + arrow buttons |
| `PlaylistSlider` | Horizontal carousel, scrolls 3 cards per arrow click |
| `PlaylistCard` | Gradient cover art, deterministic colors, selected state with color-matched border |
| `TrackItem` | 7-column row: index, title+album, artist, BPM, MiniWave, popularity, duration |
| `MiniWave` | 8-bar animated energy visualization |
| `SortProgress` | `requestAnimationFrame` progress bar 0→100% over 1.8s, fires `onDone` callback |
| `Navbar` | Brand mark logo, green glow, NavLink pill styles |

### Styling
CSS variables (`--bg`, `--surface`, `--surface2`, `--surface3`, `--border`, `--border2`, `--green`, `--text`, `--text-2`, `--text-3`, `--nav-h`) in `src/index.css`. Components use inline styles referencing those vars. Tailwind present but used minimally. Font: Inter via Google Fonts.

Note: emojis in playlist names invisible — Inter claims emoji unicode range, blocking system emoji font fallback. Known issue, unresolved.

### Deployment
Vercel via Git integration. Push to `main` = auto prod deploy. `vercel.json` present. Env vars set in Vercel dashboard.

**Vite base path:** `base: '/'` — Vercel handles routing.  
**Dev host:** `server: { host: '127.0.0.1' }` in `vite.config.js` — avoids IPv6 binding issues on Windows.
