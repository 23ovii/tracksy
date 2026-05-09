# AGENTS.md

This file provides guidance to Codex and other AI agents when working with code in this repository.

## What This Is

Tracksy is a React + TypeScript + Vite SPA for Spotify playlist sorting. It authenticates users via Spotify OAuth PKCE (no backend), loads their owned playlists, sorts tracks client-side by title, artist, popularity, date added, duration, or discography order, and writes the new order back to Spotify. Deployed to Vercel.

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
npm run dev         # Dev server at http://127.0.0.1:5173
npm run build       # Production build to /dist
npm run preview     # Preview production build locally
npm run lint        # ESLint — check for issues (warnings only, not blocking)
npm test            # Run Vitest tests once
npm run test:watch  # Run Vitest in watch mode
```

## Environment Variables

Copy `.env.example` to `.env`. Required vars:

```
VITE_SPOTIFY_CLIENT_ID=     # From Spotify Developer Dashboard
VITE_SPOTIFY_REDIRECT_URI=  # http://127.0.0.1:5173/callback for local dev
```

Optional vars:

```
VITE_POSTHOG_KEY=           # PostHog project API key (analytics, omit to disable)
VITE_POSTHOG_HOST=          # PostHog ingest host (defaults to https://eu.i.posthog.com)
```

Use `http://127.0.0.1:5173/callback` — not `localhost` — to avoid PKCE sessionStorage issues on Windows (different origins = separate sessionStorage = "Missing code verifier" error).

Scopes are hardcoded in `src/services/auth.ts`:
`user-read-private playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private`

## Tooling

- **TypeScript** — `tsconfig.json`. All source files are `.ts`/`.tsx`. Strict mode is OFF; `any` is fine.
- **ESLint** — flat config in `eslint.config.js` (ESLint v9). Warnings only, never blocking. `console.log` is allowed.
- **Prettier** — `.prettierrc`. Run manually, not enforced on commit.
- **Vitest** — test files live alongside source (`*.test.ts`). Run with `npm test`.
- **No pre-commit hooks** — Husky was removed intentionally to avoid friction while learning.

## Architecture

### Styling convention
All components use **inline `style={{...}}`** props referencing CSS variables. Do not use Tailwind `className` — Tailwind is present but used only for the minimal `src/styles/tailwind.css` config. Mixing `className` with inline styles is an inconsistency to avoid.

### Auth flow
PKCE OAuth in `src/services/auth.ts`. Code verifier stored in `sessionStorage`, swapped for tokens on `/callback`, then deleted. Auth state (`access_token`, `refresh_token`, `expires_at`) persisted to `localStorage` under key `tracksy_auth_state`. `AuthContext` (`src/context/AuthContext.tsx`) manages token refresh 1 minute before expiry via `setTimeout` and syncs auth state across tabs via `storage` events. Access via `useAuth()` hook (`src/hooks/useAuth.tsx`).

### Analytics
`src/services/analytics.ts` wraps PostHog. Only fires when `VITE_POSTHOG_KEY` is set. Respects a user opt-out flag stored in `localStorage` (`tracksy_analytics_disabled`). `autocapture` and session recording are off; only explicit `trackEvent()` calls emit events. `TrackEvents` const object defines all event names.

### Data fetching
`src/hooks/useSpotify.tsx` manages all state: playlists, tracks, selected playlist, loading flags, and Spotify write operations. Calls `src/services/spotify.ts` for every Spotify API call.

- Playlists load on dashboard mount — only playlists owned by the authenticated user (`owner.id === user.id`) are shown.
- Tracks load immediately when a playlist is selected.
- `currentSpotifyOrderRef` tracks the true current Spotify order across multiple sort/undo/restore operations.
- `applySort()` diffs against `currentSpotifyOrderRef`, so chained sorts are always correct.
- `undoLastSort()` reverts to the pre-sort order cached in `lastOriginalTracksRef`.
- `restoreOrder(targetKeys)` looks up tracks by occurrence key and calls `savePlaylistTracks`.
- Rate-limit handling: 429 responses trigger exponential backoff (multiplier increases after every 5 hits).

### Routing
`App.tsx` defines five routes: `/` (Home), `/dashboard` (protected), `/callback`, `/privacy`, and a `*` fallback to Home. `BrowserRouter` + `AuthProvider` + `ErrorBoundary` wrap the app in `main.tsx`.

### Sort flow
`Dashboard.tsx` manages playlist selection, sort state, preset management, history, undo, and filter. `sortTracks(tracks, by, dir)` in `src/utils/playlistUtils.ts` returns a sorted copy without mutating state. A 30-second undo toast appears after a successful apply — hovering it pauses the countdown.

### Sort presets
`src/services/presets.ts` stores up to 20 named presets in `localStorage` (`tracksy_presets_v1`). `PresetsRow` renders them as a scrollable chip row.

### Sort history
`src/services/sortHistory.ts` stores up to 5 history entries per playlist in `localStorage` (`tracksy_sort_history_v1`). The `SorterHeader` exposes a slide-in history drawer to restore any past order.

### Track identity
`src/utils/trackIdentity.ts` handles duplicate tracks. Keys: `${id}#${occurrence}`. `buildTrackOccurrenceKeys()` builds the key array; `restoreTracksFromKeys()` maps keys back to tracks.

### Keyboard shortcuts
`src/hooks/useKeyboardShortcuts.ts`: `1–6` select sort options, `d` toggles direction, `Enter` applies the sort, `Escape` goes back or closes the filter, `/` opens the track filter, `?` opens the shortcuts overlay.

### Spotify API calls (`src/services/spotify.ts`)
- `getSpotifyPlaylists(token)` — paginates all user-owned playlists; assigns deterministic gradient color pairs via hash
- `getSpotifyPlaylistTracks(token, playlistId)` — paginates all tracks; maps Spotify API schema to the `Track` type
- `savePlaylistTracks(token, playlistId, original, sorted)` — full PUT if ≤100 tracks with >50% changes, otherwise individual reorder requests; O(1) slot map; `AbortSignal` support

### Sort options (`src/utils/playlistUtils.ts`)
`SORT_OPTIONS` defines 6 sort keys: `name`, `artist`, `popularity`, `addedAt`, `durationMs`, `discography`. The `discography` sort groups by album, ranks artists by total track count — singles/sparse albums sink to the bottom.

### Types (`src/types.ts`)
`Track`, `Playlist`, `TokenResponse`, `SpotifyUser`, `AuthContextValue`. `SortOption` is in `playlistUtils.ts`; `SortPreset` is in `presets.ts`.

### Theme
Light/dark via `theme-light`/`theme-dark` class on `<html>`. Anti-flash script in `index.html`. `useTheme` hook manages the preference.

### Components

**Top-level (`src/components/`)**

| Component | Description |
|---|---|
| `Navbar.tsx` | Sticky header with logo, nav links, theme toggle, Sign In/Out, account menu |
| `Footer.tsx` | Footer with links |
| `PlaylistCard.tsx` | Playlist card with cover or gradient |
| `PlaylistSlider.tsx` | Horizontally scrollable playlist carousel |
| `SortProgress.tsx` | Animated progress bar; fires `onDone` on completion |
| `TrackItem.tsx` | Track row: index, delta, album art, title, artist, popularity, duration |
| `ShortcutsOverlay.tsx` | Keyboard shortcut reference panel |
| `ProtectedRoute.tsx` | Redirects unauthenticated users to `/` |
| `ErrorBoundary.tsx` | Class component; catches JS errors; inline-styled error panel |

**Dashboard sub-components (`src/components/dashboard/`)**

| Component | Description |
|---|---|
| `LibraryPanel.tsx` | Playlist list with refresh button |
| `SorterHeader.tsx` | Playlist info, Apply/Cancel, history drawer |
| `SortChips.tsx` | Sort field selector chips |
| `PresetsRow.tsx` | Saved preset chips |
| `TrackTable.tsx` | Track list with filter and preview toggle |
| `AmbientBackdrop.tsx` | Full-screen color gradient from playlist colors |
| `PlaylistCover.tsx` | Playlist thumbnail |

### localStorage keys

| Key | Purpose |
|---|---|
| `tracksy_auth_state` | OAuth tokens and expiry |
| `tracksy_presets_v1` | Saved sort presets (up to 20) |
| `tracksy_sort_history_v1` | Sort history per playlist (up to 5 per playlist) |
| `tracksy_analytics_disabled` | User analytics opt-out flag |
| `tracksy_theme` | Theme preference (`dark`, `light`, `system`) |
| `tracksy_show_preview` | Album art preview column visibility |

### Deployment
Vercel via Git integration. Every push to `main` triggers an automatic production deployment. `vercel.json` configures SPA routing and security headers. Environment variables are set in the Vercel dashboard.

**Vite base path:** `base: '/'` — Vercel handles routing.
**Dev host:** `server: { host: '127.0.0.1' }` in `vite.config.js` — avoids IPv6 binding issues on Windows.
