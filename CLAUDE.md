# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
`src/services/analytics.ts` wraps PostHog. Only fires when `VITE_POSTHOG_KEY` is set. Respects a user opt-out flag stored in `localStorage` (`tracksy_analytics_disabled`). `autocapture` and session recording are off; only explicit `trackEvent()` calls emit events. `TrackEvents` const object defines all event names. In dev, `posthog` and `trackEvent` are exposed on `window`.

### Data fetching
TanStack React Query manages Spotify data. `src/api/playlists.ts` provides `usePlaylists()` and `usePlaylistTracks()`; `src/api/mutations.ts` owns the reorder mutation; `src/api/queryClient.ts` configures caching. `src/services/spotify.ts` contains the Spotify requests, while `src/hooks/useReorderOperation.ts` manages cancellation, progress, and rate-limit state.

- Playlists load on dashboard mount — only playlists owned by the authenticated user (`owner.id === user.id`) are shown.
- Selecting a playlist enables its track query; the query cache is the source of truth for the current Spotify order.
- `Dashboard.tsx` derives the selected sort and movement preview from the cached tracks; reorder mutations optimistically update the cache, roll back on failure, and refetch the authoritative order afterward.
- Preset and sort-history state is managed by `src/hooks/useDashboardPresetsHistory.ts`.
- Rate-limit handling is bounded and honors Spotify's retry delay, with progress and retry status surfaced to the dashboard.

### Routing
`App.tsx` defines `/` (Home), `/dashboard` (protected), `/callback`, `/privacy`, and a `*` fallback to Home. `main.tsx` mounts the app under `StrictMode`, `QueryClientProvider`, `BrowserRouter`, `AuthProvider`, and `ErrorBoundary`. `@vercel/analytics` and `@vercel/speed-insights` are mounted in `App.tsx`; PostHog pageviews are captured on route change.

### Sort flow
`Dashboard.tsx` manages playlist selection, ordered sort criteria, presets, history, undo, and filtering. `SortCriteriaEditor` lets users add, remove, and reorder criteria, with a direction per criterion except `discography`, which has a fixed order. `sortTracks(tracks, criteria)` in `src/utils/playlistUtils.ts` returns a sorted copy without mutating state; legacy single-key calls remain supported. Applying, undoing, or restoring an order uses `useReorderOperation` and the React Query mutation in `src/api/mutations.ts`; the mutation optimistically updates the track cache, rolls it back on failure, and refetches Spotify's authoritative order afterward. `SortProgress` reports write progress and rate-limit status. A 30-second undo toast appears after a successful apply — hovering it pauses the countdown.

### Sort presets
`src/services/presets.ts` stores up to 20 named presets in `localStorage` (`tracksy_presets_v1`), including ordered sort criteria. Existing single-key presets are migrated when read. `PresetsRow` in the Dashboard renders them as a scrollable chip row.

### Sort history
`src/services/sortHistory.ts` stores up to 5 history entries per playlist in `localStorage` (`tracksy_sort_history_v1`). Each entry captures the track order before and after a sort using occurrence keys. The `SorterHeader` exposes a slide-in history drawer to restore any past order.

### Track identity
`src/utils/trackIdentity.ts` handles playlists with duplicate tracks. Tracks are keyed as `${id}#${occurrence}` (e.g., `abc123#0`, `abc123#1`) so each duplicate copy is addressable independently. `buildTrackOccurrenceKeys()` builds the key array; `restoreTracksFromKeys()` maps keys back to track objects. History entries store `trackKeysBefore`/`trackKeysAfter` with this scheme.

### Keyboard shortcuts
`src/hooks/useKeyboardShortcuts.ts` attaches a `keydown` listener and dispatches to a map of `key → handler`. Keys `1–6` select the primary sort option, `d` toggles its direction, `Enter` applies the sort, `Escape` goes back or closes the filter, `/` opens the track filter, and `?` opens the shortcuts overlay. Text-entry targets suppress shortcuts, and Enter is left to native activation when focus is on an interactive control.

### Spotify API calls (`src/services/spotify.ts`)
- `getSpotifyPlaylists(token)` — paginates all user-owned playlists; assigns deterministic gradient color pairs via hash on playlist ID
- `getSpotifyPlaylistTracks(token, playlistId)` — paginates all tracks; maps Spotify API schema to the `Track` type; filters out null/local tracks
- `savePlaylistTracks(token, playlistId, original, sorted)` — optimizes reorder: full PUT if ≤100 tracks with >50% changes, otherwise individual reorder requests; tracks current position with a `slot` map for O(1) lookups; respects `AbortSignal` and rate-limit backoff

### Sort options (`src/utils/playlistUtils.ts`)
`SORT_OPTIONS` defines 6 sort keys: `name`, `artist`, `popularity`, `addedAt`, `durationMs`, `discography`. `sortTracks(tracks, criteria)` applies an ordered list of criteria; the legacy `(tracks, key, direction)` form remains supported. Discography has a fixed built-in order: it groups by Spotify album ID, falling back to normalized album name plus primary artist, ranks artists by total track count, then ranks albums within each artist by size — singles and sparse albums sink to the bottom.

### Types (`src/types.ts`)
Central type definitions for `Track`, `Playlist`, `TokenResponse`, `SpotifyUser`, and `AuthContextValue`. `SortOption` lives in `src/utils/playlistUtils.ts`; `SortPreset` lives in `src/services/presets.ts`.

### Theme
Light and dark themes defined via CSS classes (`theme-light`, `theme-dark`) on `<html>`. A flash-of-wrong-theme script in `index.html` reads `localStorage('tracksy_theme')` and applies the class before React renders. `useTheme` hook (`src/hooks/useTheme.ts`) manages the preference and toggles the class. The Navbar exposes the toggle button.

### Components

**Top-level (`src/components/`)**

| Component | Description |
|---|---|
| `Navbar.tsx` | Sticky header with logo, nav links, theme toggle, Sign In/Out button, account menu (analytics opt-out and data wipe) |
| `Footer.tsx` | Simple footer with links |
| `PlaylistCard.tsx` | Clickable card with playlist cover image or deterministic gradient, name, track count |
| `PlaylistSlider.tsx` | Horizontally scrollable playlist carousel with prev/next nav and edge fade overlays |
| `SortProgress.tsx` | Animated progress bar for sort application; fires `onDone` when Spotify write resolves; reports rate-limit warnings |
| `TrackItem.tsx` | Track row: index, movement delta, title, artist, popularity, and duration |
| `ShortcutsOverlay.tsx` | Full-screen keyboard shortcut reference panel, toggled by `?` |
| `ProtectedRoute.tsx` | Redirects to `/` if not authenticated |
| `ErrorBoundary.tsx` | Class component catching JS errors; shows inline-styled error panel and reload button |

**Dashboard sub-components (`src/components/dashboard/`)**

| Component | Description |
|---|---|
| `LibraryPanel.tsx` | Glass-morphism panel listing the user's playlists with a refresh button |
| `SorterHeader.tsx` | Playlist cover, title, track count, duration, Apply/Cancel buttons, slide-in history drawer |
| `SortCriteriaEditor.tsx` | Ordered sort fields with per-criterion direction and add, remove, and move controls |
| `PresetsRow.tsx` | Scrollable row of saved sort presets with save/delete/load controls |
| `TrackTable.tsx` | Accessible table with sticky column headers, scrollable tracks, filter, and movement-delta preview toggle |
| `AmbientBackdrop.tsx` | Fixed fullscreen radial gradient derived from the selected playlist's colors |
| `PlaylistCover.tsx` | Square thumbnail with playlist image or music note icon fallback |

**Contexts**

| Context | Description |
|---|---|
| `AuthProvider` | Provides `token`, `refreshToken`, `expiresAt`, `isAuthenticated`, `user`, `login`, `logout` through `useAuth()` |
| `ShortcutsOverlayContext` | Provides `open` and `toggle` for the keyboard shortcuts overlay |

### Styling
CSS variables (`--bg`, `--surface`, `--glass-bg`, `--border`, `--border2`, `--green`, `--text`, `--text-2`, `--text-3`, `--nav-h`, `--shadow-card`, etc.) defined in `src/index.css` for both dark (default) and light themes. Components use inline styles referencing those variables. Font: Inter loaded via Google Fonts CDN in `index.html`.

Note: emojis in playlist names are not visible — Inter (Google Fonts) claims the emoji unicode range, preventing system emoji font fallback. Known issue, left unresolved.

### localStorage keys

| Key | Purpose |
|---|---|
| `tracksy_auth_logout` | Transient, non-secret cross-tab logout signal |
| `tracksy_presets_v1` | Saved sort presets (up to 20) |
| `tracksy_sort_history_v1` | Sort history per playlist (up to 5 per playlist) |
| `tracksy_analytics_disabled` | User analytics opt-out flag |
| `tracksy_theme` | Theme preference (`dark`, `light`, `system`) |
| `tracksy_show_preview` | Whether movement-delta preview is shown in the track table |

### sessionStorage keys

| Key | Purpose |
|---|---|
| `tracksy_auth_state` | Per-tab OAuth tokens and expiry |

### Deployment
Vercel via Git integration. Every push to `main` triggers an automatic production deployment. `vercel.json` configures SPA routing and security headers (CSP, Referrer-Policy, Permissions-Policy). Environment variables are set in the Vercel dashboard.

**Vite base path:** `base: '/'` — Vercel handles routing.
**Dev host:** `server: { host: '127.0.0.1' }` in `vite.config.js` — avoids IPv6 binding issues on Windows.
