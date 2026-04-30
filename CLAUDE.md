# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Tracksy is a React + TypeScript + Vite SPA for Spotify playlist sorting. It authenticates users via Spotify OAuth PKCE (no backend), loads their owned playlists, sorts tracks client-side by title, artist, popularity, date added, or duration, and writes the new order back to Spotify. Deployed to Vercel.

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

Scopes are hardcoded in `src/services/auth.ts`:
`user-read-private playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private`

## Tooling

- **TypeScript** — `tsconfig.json`. All source files are `.ts`/`.tsx`. Strict mode is OFF; `any` is fine.
- **ESLint** — flat config in `eslint.config.js` (ESLint v9). Warnings only, never blocking. `console.log` is allowed.
- **Prettier** — `.prettierrc`. Run manually, not enforced on commit.
- **Vitest** — test files live alongside source (`*.test.ts`). Run with `npx vitest`.
- **No pre-commit hooks** — Husky was removed intentionally to avoid friction while learning.

## Architecture

### Auth flow
PKCE OAuth in `src/services/auth.ts`. Code verifier stored in `sessionStorage`, swapped for tokens on `/callback`, then deleted. Auth state (`token`, `refreshToken`, `expiresAt`) persisted to `localStorage` under key `tracksy_auth_state`. `AuthContext` (`src/context/AuthContext.tsx`) manages token refresh 1 minute before expiry via `setTimeout`. Access via `useAuth()` hook (`src/hooks/useAuth.tsx`).

### Data fetching
`src/hooks/useSpotify.tsx` manages all state: playlists, tracks, selected playlist, loading flags, undo state, and rate-limit feedback. Calls `src/services/spotify.ts` for every Spotify API call.

- Playlists load on dashboard mount — only playlists owned by the authenticated user (`owner.id === user.id`) are shown.
- Tracks load immediately when a playlist is selected.
- `undoLastSort()` reverts to the pre-sort order cached before `applySort` runs; the undo window is 30 seconds.
- Rate-limit handling: 429 responses trigger exponential backoff (multiplier increases after every 5 hits); progress callback reports `isRateLimited` so the UI can warn the user.

### Routing
`App.tsx` defines four routes: `/` (Home), `/dashboard` (protected), `/callback`, and a `*` fallback to Home. `BrowserRouter` + `AuthProvider` + `ErrorBoundary` wrap the app in `main.tsx`. `@vercel/analytics` and `@vercel/speed-insights` are mounted in `App.tsx`.

### Sort flow
`Dashboard.tsx` manages playlist selection and sort state. `SortChips` lets the user pick a sort field; toggling the same chip reverses direction. `sortTracks(tracks, by, dir)` in `src/utils/playlistUtils.ts` returns a sorted copy without mutating state. Clicking "Apply to Spotify" shows `SortProgress` then calls `applySort()` in `useSpotify`, which calls `savePlaylistTracks()`. A 30-second undo toast appears after a successful apply.

### Spotify API calls (`src/services/spotify.ts`)
- `getSpotifyPlaylists(token)` — paginates all user-owned playlists; assigns deterministic gradient color pairs via hash
- `getSpotifyPlaylistTracks(token, playlistId)` — paginates all tracks; maps Spotify API schema to the `Track` type
- `savePlaylistTracks(token, playlistId, original, sorted)` — optimizes reorder: full PUT if <100 tracks with >50% changes, otherwise individual reorder requests; respects `AbortSignal` and rate-limit backoff

### Sort options (`src/utils/playlistUtils.ts`)
`SORT_OPTIONS` defines 5 sort keys: `name`, `artist`, `popularity`, `addedAt`, `durationMs`. `sortTracks(tracks, by, dir)` handles all of them.

### Types (`src/types.ts`)
Central type definitions for `Track`, `Playlist`, `SortOption`, and related interfaces used across the app.

### Components

**Top-level (`src/components/`)**
| Component | Description |
|---|---|
| `Navbar.tsx` | Sticky header with Tracksy logo, nav links, Sign In/Out buttons |
| `PlaylistCard.tsx` | Clickable card with playlist cover image or deterministic gradient, name, track count |
| `PlaylistSlider.tsx` | Horizontally scrollable playlist carousel with prev/next nav and edge fade overlays |
| `SortProgress.tsx` | Progress bar for sort application; reports rate-limit warnings via callback |
| `TrackItem.tsx` | Table row: index, title, album, artist, popularity, duration |
| `ProtectedRoute.tsx` | Redirects to `/` if not authenticated |
| `ErrorBoundary.tsx` | Class component catching JS errors; shows error message and reload button |

**Dashboard sub-components (`src/components/dashboard/`)**
| Component | Description |
|---|---|
| `LibraryPanel.tsx` | Glass-morphism panel listing the user's playlists with a refresh button |
| `SorterHeader.tsx` | Playlist cover, title, track count, duration, Apply and Cancel buttons |
| `SortChips.tsx` | Horizontal chip tabs for choosing sort field; shows asc/desc indicator on active chip |
| `TrackTable.tsx` | Sticky column headers + scrollable track list |
| `AmbientBackdrop.tsx` | Fixed fullscreen radial gradient derived from the selected playlist's colors |
| `PlaylistCover.tsx` | Square thumbnail with playlist image or music icon fallback |

### Styling
CSS variables (`--bg`, `--surface`, `--surface2`, `--surface3`, `--border`, `--border2`, `--green`, `--text`, `--text-2`, `--text-3`, `--nav-h`) defined in `src/index.css`. Components use inline styles referencing those variables. Tailwind is present but used minimally. Font: Inter via Google Fonts.

Note: emojis in playlist names are not visible — Inter (Google Fonts) claims the emoji unicode range, preventing system emoji font fallback. Known issue, left unresolved.

### Deployment
Vercel via Git integration. Every push to `main` triggers an automatic production deployment. `vercel.json` is present. Environment variables are set in the Vercel dashboard.

**Vite base path:** `base: '/'` — Vercel handles routing.  
**Dev host:** `server: { host: '127.0.0.1' }` in `vite.config.js` — avoids IPv6 binding issues on Windows.
