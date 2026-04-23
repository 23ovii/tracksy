# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Tracksy is a React + Vite frontend for Spotify playlist sorting. It uses the Spotify OAuth PKCE flow (no backend) to authenticate users, load their playlists, and sort tracks by BPM, energy, popularity, date added, or duration — then push the sorted order back to Spotify. Deployed to Vercel.

## Commands

```bash
npm run dev       # Dev server at http://127.0.0.1:5173
npm run build     # Production build to /dist
npm run preview   # Preview production build locally
```

No test or lint scripts are configured.

## Environment Variables

Copy `.env.example` to `.env`. Required vars:

```
VITE_SPOTIFY_CLIENT_ID=     # From Spotify Developer Dashboard
VITE_SPOTIFY_REDIRECT_URI=  # e.g. http://127.0.0.1:5173/callback for dev
```

Scopes are hardcoded in `src/services/auth.js`.

## Architecture

**Auth flow:** PKCE OAuth in `src/services/auth.js`. The code verifier is stored in `sessionStorage`, swapped for a token on callback, then deleted. Auth state (token, refreshToken, expiresAt) is persisted to `localStorage` under key `tracksy_auth_state` and managed by `AuthContext` (`src/context/AuthContext.jsx`). Access via `useAuth()` hook.

**Data fetching:** `src/hooks/useSpotify.jsx` manages playlists, tracks, selected playlist, and loading state. It calls `src/services/spotify.js` for all Spotify API calls. After loading tracks, it fetches audio features (BPM, energy) via `GET /v1/audio-features` and merges them into the track objects.

**Routing:** `App.jsx` defines three routes: `/` (Home/login), `/dashboard` (main view), `/callback` (OAuth handler). `BrowserRouter` + `AuthProvider` wrap the app in `main.jsx`.

**Sort flow:** Dashboard maintains `sortBy`/`sortDir` state. `sortTracks()` from `src/utils/playlistUtils.js` computes the sorted order client-side. "Apply to Spotify" triggers a progress animation and calls `savePlaylistTracks()` which uses `PUT /v1/playlists/{id}/tracks` + `POST` for batches > 100.

**Playlist colors:** Since Spotify doesn't return colors, `spotify.js` assigns deterministic gradient pairs from a palette based on a hash of the playlist ID.

**Components:**
- `PlaylistGrid` / `PlaylistSlider` — two layout modes for the playlist picker, toggled by the user and persisted to localStorage
- `PlaylistCard` — gradient cover art, selected state with color-matched border
- `TrackItem` — 7-column row: index, title+album, artist, BPM, MiniWave energy, popularity, duration
- `MiniWave` — energy visualization using 8 animated bars
- `SortProgress` — 1.8s animated progress bar shown during apply

**Styling:** CSS variables (`--bg`, `--surface`, `--green`, etc.) defined in `src/index.css`. Components use inline styles with those variables. Tailwind is present but used minimally. Font: Inter (loaded via Google Fonts in `index.html`).

**Vite base path:** `base: '/'` — Vercel handles routing, no subdirectory prefix needed.
**Dev host:** Vite is configured to bind to `127.0.0.1` (not localhost) to avoid IPv6 issues on Windows.
