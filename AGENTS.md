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

- **TypeScript** — `tsconfig.json`. Strict mode is enabled; prefer explicit types and avoid `any` (ESLint warns on it).
- **ESLint** — flat config in `eslint.config.js` (ESLint v9). Warnings only, never blocking. `console.log` is allowed.
- **Prettier** — `.prettierrc`. Run manually, not enforced on commit.
- **Vitest** — test files live alongside source (`*.test.ts`). Run with `npm test`.
- **No pre-commit hooks** — Husky was removed intentionally to avoid friction while learning.

## Architecture

### Styling convention
All components use **inline `style={{...}}`** props referencing CSS variables. Do not use Tailwind `className` — Tailwind is present but used only for the minimal `src/styles/tailwind.css` config. Mixing `className` with inline styles is an inconsistency to avoid.

### Auth flow
PKCE OAuth in `src/services/auth.ts`. Code verifier stored in `sessionStorage`, swapped for tokens on `/callback`, then deleted. Auth state (`access_token`, `refresh_token`, `expires_at`) is kept in per-tab `sessionStorage` under `tracksy_auth_state`; legacy local-storage auth state is migrated and removed. `AuthProvider` (`src/auth/AuthProvider.tsx`) refreshes tokens 1 minute before expiry and broadcasts logout across tabs with a transient, non-secret local-storage signal. Sign-in state is not synchronized across tabs. Access auth via `useAuth()` (`src/auth/AuthProvider.tsx`).

### Analytics
`src/services/analytics.ts` wraps PostHog. Only fires when `VITE_POSTHOG_KEY` is set. Respects a user opt-out flag stored in `localStorage` (`tracksy_analytics_disabled`). `autocapture` and session recording are off; only explicit `trackEvent()` calls emit events. `TrackEvents` const object defines all event names.

### Data fetching
TanStack React Query manages Spotify data. `src/api/playlists.ts` provides `usePlaylists()` and `usePlaylistTracks()`; `src/api/mutations.ts` owns the reorder mutation; `src/api/queryClient.ts` configures caching. `src/services/spotify.ts` contains the Spotify requests, while `src/hooks/useReorderOperation.ts` manages cancellation, progress, and rate-limit state.

- Playlists load on dashboard mount — only playlists owned by the authenticated user (`owner.id === user.id`) are shown.
- Selecting a playlist enables its track query; the query cache is the source of truth for the current Spotify order.
- `Dashboard.tsx` derives the selected sort and movement preview from the cached tracks; reorder mutations optimistically update the cache, roll back on failure, and refetch the authoritative order afterward.
- Preset and sort-history state is managed by `src/hooks/useDashboardPresetsHistory.ts`.
- Rate-limit handling is bounded and honors Spotify's retry delay, with progress and retry status surfaced to the dashboard.

### Routing
`App.tsx` defines `/` (Home), `/dashboard` (protected), `/callback`, `/privacy`, and a `*` fallback to Home. `main.tsx` mounts the app under `StrictMode`, `QueryClientProvider`, `BrowserRouter`, `AuthProvider`, and `ErrorBoundary`.

### Sort flow
`Dashboard.tsx` manages playlist selection, ordered sort criteria, presets, history, undo, and filtering. `sortTracks(tracks, criteria)` in `src/utils/playlistUtils.ts` applies each key and direction in order, returning a sorted copy without mutating state. Legacy single-key calls remain supported. A 30-second undo toast appears after a successful apply — hovering it pauses the countdown.

### Sort presets
`src/services/presets.ts` stores up to 20 named presets in `localStorage` (`tracksy_presets_v1`). `PresetsRow` renders them as a scrollable chip row.

### Sort history
`src/services/sortHistory.ts` stores up to 5 history entries per playlist in `localStorage` (`tracksy_sort_history_v1`). The `SorterHeader` exposes a slide-in history drawer to restore any past order.

### Track identity
`src/utils/trackIdentity.ts` handles duplicate tracks. Keys: `${id}#${occurrence}`. `buildTrackOccurrenceKeys()` builds the key array; `restoreTracksFromKeys()` maps keys back to tracks.

### Keyboard shortcuts
`src/hooks/useKeyboardShortcuts.ts`: `1–6` select the primary sort option, `d` toggles its direction, `Enter` applies the sort, `Escape` goes back or closes the filter, `/` opens the track filter, `?` opens the shortcuts overlay.

### Spotify API calls (`src/services/spotify.ts`)
- `getSpotifyPlaylists(token)` — paginates all user-owned playlists; assigns deterministic gradient color pairs via hash
- `getSpotifyPlaylistTracks(token, playlistId)` — paginates all tracks; maps Spotify API schema to the `Track` type
- `savePlaylistTracks(token, playlistId, original, sorted)` — full PUT if ≤100 tracks with >50% changes, otherwise individual reorder requests; O(1) slot map; `AbortSignal` support

### Sort options (`src/utils/playlistUtils.ts`)
`SORT_OPTIONS` defines 6 sort keys: `name`, `artist`, `popularity`, `addedAt`, `durationMs`, `discography`. `sortTracks(tracks, criteria)` applies an ordered list of criteria; the legacy `(tracks, key, direction)` form remains supported. Discography has a fixed built-in order: it groups by Spotify album ID, falling back to normalized album name plus primary artist, ranks artists by total track count, and sinks singles/sparse albums to the bottom.

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
| `TrackItem.tsx` | Track row: index, movement delta, title, artist, popularity, and duration |
| `ShortcutsOverlay.tsx` | Keyboard shortcut reference panel |
| `ProtectedRoute.tsx` | Redirects unauthenticated users to `/` |
| `ErrorBoundary.tsx` | Class component; catches JS errors; inline-styled error panel |

**Dashboard sub-components (`src/components/dashboard/`)**

| Component | Description |
|---|---|
| `LibraryPanel.tsx` | Playlist list with refresh button |
| `SorterHeader.tsx` | Playlist info, Apply/Cancel, history drawer |
| `SortCriteriaEditor.tsx` | Ordered sort fields with per-criterion direction and add, remove, and move controls |
| `PresetsRow.tsx` | Saved preset chips |
| `TrackTable.tsx` | Accessible track table with filter and movement-delta preview toggle |
| `AmbientBackdrop.tsx` | Full-screen color gradient from playlist colors |
| `PlaylistCover.tsx` | Playlist thumbnail |

### localStorage keys

| Key | Purpose |
|---|---|
| `tracksy_auth_logout` | Transient, non-secret cross-tab logout signal |
| `tracksy_presets_v1` | Saved sort presets (up to 20) |
| `tracksy_sort_history_v1` | Sort history per playlist (up to 5 per playlist) |
| `tracksy_analytics_disabled` | User analytics opt-out flag |
| `tracksy_theme` | Theme preference (`dark`, `light`, `system`) |
| `tracksy_show_preview` | Movement-delta preview visibility |

### sessionStorage keys

| Key | Purpose |
|---|---|
| `tracksy_auth_state` | Per-tab OAuth tokens and expiry |

### Deployment
Vercel via Git integration. Every push to `main` triggers an automatic production deployment. `vercel.json` configures SPA routing and security headers. Environment variables are set in the Vercel dashboard.

**Vite base path:** `base: '/'` — Vercel handles routing.
**Dev host:** `server: { host: '127.0.0.1' }` in `vite.config.js` — avoids IPv6 binding issues on Windows.
