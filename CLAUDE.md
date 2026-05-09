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
`src/services/analytics.ts` wraps PostHog. Only fires when `VITE_POSTHOG_KEY` is set. Respects a user opt-out flag stored in `localStorage` (`tracksy_analytics_disabled`). `autocapture` and session recording are off; only explicit `trackEvent()` calls emit events. `TrackEvents` const object defines all event names. In dev, `posthog` and `trackEvent` are exposed on `window`.

### Data fetching
`src/hooks/useSpotify.tsx` manages all state: playlists, tracks, selected playlist, loading flags, and Spotify write operations. Calls `src/services/spotify.ts` for every Spotify API call.

- Playlists load on dashboard mount — only playlists owned by the authenticated user (`owner.id === user.id`) are shown.
- Tracks load immediately when a playlist is selected.
- `currentSpotifyOrderRef` tracks the true current Spotify order across multiple sort/undo/restore operations.
- `applySort()` diffs against `currentSpotifyOrderRef` (not the loaded tracks), so chained sorts are always correct.
- `undoLastSort()` reverts to the pre-sort order cached in `lastOriginalTracksRef`.
- `restoreOrder(targetKeys)` looks up tracks by occurrence key (see Track Identity) and calls `savePlaylistTracks`.
- Rate-limit handling: 429 responses trigger exponential backoff (multiplier increases after every 5 hits).

### Routing
`App.tsx` defines five routes: `/` (Home), `/dashboard` (protected), `/callback`, `/privacy`, and a `*` fallback to Home. `BrowserRouter` + `AuthProvider` + `ErrorBoundary` wrap the app in `main.tsx`. `@vercel/analytics` and `@vercel/speed-insights` are mounted in `App.tsx`. PostHog pageview is captured on route change.

### Sort flow
`Dashboard.tsx` manages playlist selection, sort state, preset management, history, undo, and filter. `SortChips` lets the user pick a sort field; toggling the same chip reverses direction (except `discography` which has no direction). `sortTracks(tracks, by, dir)` in `src/utils/playlistUtils.ts` returns a sorted copy without mutating state. Clicking "Apply to Spotify" shows `SortProgress` then calls `applySort()` in `useSpotify`, which calls `savePlaylistTracks()`. A 30-second undo toast appears after a successful apply — hovering it pauses the countdown.

### Sort presets
`src/services/presets.ts` stores up to 20 named presets in `localStorage` (`tracksy_presets_v1`). Each preset captures `sortBy` and `sortDir`. `PresetsRow` in the Dashboard renders them as a scrollable chip row.

### Sort history
`src/services/sortHistory.ts` stores up to 5 history entries per playlist in `localStorage` (`tracksy_sort_history_v1`). Each entry captures the track order before and after a sort using occurrence keys. The `SorterHeader` exposes a slide-in history drawer to restore any past order.

### Track identity
`src/utils/trackIdentity.ts` handles playlists with duplicate tracks. Tracks are keyed as `${id}#${occurrence}` (e.g., `abc123#0`, `abc123#1`) so each duplicate copy is addressable independently. `buildTrackOccurrenceKeys()` builds the key array; `restoreTracksFromKeys()` maps keys back to track objects. History entries store `trackKeysBefore`/`trackKeysAfter` with this scheme.

### Keyboard shortcuts
`src/hooks/useKeyboardShortcuts.ts` attaches a `keydown` listener and dispatches to a map of `key → handler`. Keys `1–6` select sort options, `d` toggles direction, `Enter` applies the sort, `Escape` goes back or closes the filter, `/` opens the track filter, `?` opens the shortcuts overlay. Shortcuts are suppressed inside `<input>` and `<textarea>` elements and when the overlay is open.

### Spotify API calls (`src/services/spotify.ts`)
- `getSpotifyPlaylists(token)` — paginates all user-owned playlists; assigns deterministic gradient color pairs via hash on playlist ID
- `getSpotifyPlaylistTracks(token, playlistId)` — paginates all tracks; maps Spotify API schema to the `Track` type; filters out null/local tracks
- `savePlaylistTracks(token, playlistId, original, sorted)` — optimizes reorder: full PUT if ≤100 tracks with >50% changes, otherwise individual reorder requests; tracks current position with a `slot` map for O(1) lookups; respects `AbortSignal` and rate-limit backoff

### Sort options (`src/utils/playlistUtils.ts`)
`SORT_OPTIONS` defines 6 sort keys: `name`, `artist`, `popularity`, `addedAt`, `durationMs`, `discography`. `sortTracks(tracks, by, dir)` handles all of them. The `discography` sort groups tracks by album, ranks artists by total track count, then ranks albums within each artist by size — singles and sparse albums sink to the bottom.

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
| `TrackItem.tsx` | Table row: index, delta indicator, album art preview, title, artist, popularity, duration |
| `ShortcutsOverlay.tsx` | Full-screen keyboard shortcut reference panel, toggled by `?` |
| `ProtectedRoute.tsx` | Redirects to `/` if not authenticated |
| `ErrorBoundary.tsx` | Class component catching JS errors; shows inline-styled error panel and reload button |

**Dashboard sub-components (`src/components/dashboard/`)**
| Component | Description |
|---|---|
| `LibraryPanel.tsx` | Glass-morphism panel listing the user's playlists with a refresh button |
| `SorterHeader.tsx` | Playlist cover, title, track count, duration, Apply/Cancel buttons, slide-in history drawer |
| `SortChips.tsx` | Horizontal chip tabs for choosing sort field; shows asc/desc indicator on active chip |
| `PresetsRow.tsx` | Scrollable row of saved sort presets with save/delete/load controls |
| `TrackTable.tsx` | Sticky column headers + scrollable track list; filter bar; album art preview toggle |
| `AmbientBackdrop.tsx` | Fixed fullscreen radial gradient derived from the selected playlist's colors |
| `PlaylistCover.tsx` | Square thumbnail with playlist image or music note icon fallback |

**Contexts**
| Context | Description |
|---|---|
| `AuthContext` | Provides `token`, `refreshToken`, `expiresAt`, `isAuthenticated`, `user`, `login`, `logout` |
| `ShortcutsOverlayContext` | Provides `open` and `toggle` for the keyboard shortcuts overlay |

### Styling
CSS variables (`--bg`, `--surface`, `--glass-bg`, `--border`, `--border2`, `--green`, `--text`, `--text-2`, `--text-3`, `--nav-h`, `--shadow-card`, etc.) defined in `src/index.css` for both dark (default) and light themes. Components use inline styles referencing those variables. Font: Inter loaded via Google Fonts CDN in `index.html`.

Note: emojis in playlist names are not visible — Inter (Google Fonts) claims the emoji unicode range, preventing system emoji font fallback. Known issue, left unresolved.

### localStorage keys
| Key | Purpose |
|---|---|
| `tracksy_auth_state` | OAuth tokens and expiry |
| `tracksy_presets_v1` | Saved sort presets (up to 20) |
| `tracksy_sort_history_v1` | Sort history per playlist (up to 5 per playlist) |
| `tracksy_analytics_disabled` | User analytics opt-out flag |
| `tracksy_theme` | Theme preference (`dark`, `light`, `system`) |
| `tracksy_show_preview` | Whether album art preview column is shown in track table |

### Deployment
Vercel via Git integration. Every push to `main` triggers an automatic production deployment. `vercel.json` configures SPA routing and security headers (CSP, Referrer-Policy, Permissions-Policy). Environment variables are set in the Vercel dashboard.

**Vite base path:** `base: '/'` — Vercel handles routing.
**Dev host:** `server: { host: '127.0.0.1' }` in `vite.config.js` — avoids IPv6 binding issues on Windows.
