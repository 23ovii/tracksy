# Project TODO
> Last updated: 2026-04-27

## 🔥 High Priority

### P0 — Critical Bugs
- [ ] Fix Tailwind content glob (production CSS bug) - Change content array to include .ts/.tsx files, define shadow-glow class
- [ ] Align marketing copy with actually-shipped sort keys - Update all references from BPM/energy/mood to actual sort options
- [ ] Add OAuth `state` parameter for CSRF protection - Implement state validation in auth flow
- [ ] Guard `Callback.tsx` against React StrictMode double-invoke - Add useRef guard to prevent double execution

### P1 — High-impact polish
- [ ] Replace array-index keys on TrackItem with stable IDs - Use track.id instead of array index
- [ ] Re-enable react-hooks ESLint rules - Enable rules-of-hooks and exhaustive-deps
- [ ] Add CSP and security headers in vercel.json - Implement Content-Security-Policy and security headers
- [ ] Add a top-level ErrorBoundary - Create error boundary component wrapping App
- [ ] Extract a `<ProtectedRoute>` wrapper - Reusable authentication wrapper for routes
- [ ] Multi-tab sign-out sync - Sync auth state across tabs via storage event

## 🐛 Bugs to Fix

### Track Identity & Validation
- [ ] Fix track identity mapping bug in savePlaylistTracks - Rekey Map by array index instead of object reference
- [ ] Add input validation to mapTrack and mapPlaylist - Filter out items where id is null/undefined/empty

### Rate Limiting
- [ ] Fix rate limit retry - Add max retry count of 5 instead of infinite loop
- [ ] Fix unbounded backoff multiplier - Cap multiplier at 4x
- [ ] Improve rate limit message UX - Better messaging and disable Apply button during retry

### Auth & Session
- [ ] Add missing token validation in Callback.tsx - Validate access_token exists before calling login()
- [ ] Add 401 re-auth handling - Detect 401 responses and redirect to login with message
- [ ] Fix silent logout on token refresh failure - Surface message to user before clearing auth state
- [ ] Add logout confirmation - Confirmation step before clearing auth state

### UI State
- [ ] Fix AbortController race condition in applySort - Abort previous request before creating new controller
- [ ] Prevent spam-clicking Refresh playlists button - Disable button while loading
- [ ] Add empty playlist state - Show message when playlist has 0 tracks
- [ ] Cancel sort stays on playlist - When canceling an in-progress sort, show a notification and remain on the current playlist instead of navigating back

### Dead Code
- [ ] Wire up removeDuplicateTracks function - Call before sorting and notify user of removed duplicates

## ✨ Features to Add

### Tier S — Highest Leverage
- [ ] Restore BPM, energy, and danceability via ReccoBeats - Re-implement audio features using ReccoBeats API
- [ ] Smart Shuffle: energy-curve ordering - Energy-curve sort with warm-up, peak, cool-down
- [ ] Sort presets (saved configurations) - Save and re-apply sort configurations
- [ ] Sort preview / diff visualization - Show what changes before applying to Spotify

### Tier A — High Value, Modest Effort
- [ ] Multi-sort with tiebreakers - Stack up to 3 sort keys with priority order
- [ ] Filter before sort - Add filter bar (search, year range, popularity, duration)
- [ ] Sort history (last 5 operations per playlist) - Persistent history with restore capability
- [ ] Playlist diff badges (what changed since last visit) - Badge playlists with +N −M indicators
- [ ] Keyboard shortcuts + help overlay - Power-user shortcuts with discoverable help
- [ ] Make Tracksy a PWA - Installable with offline support and app icon

### Tier B — Nice to Have
- [ ] Dark/light theme with system preference detection - Add light theme alongside dark
- [ ] i18n with English + 4 starter locales - Add Spanish, Portuguese, French, German
- [ ] SEO landing pages with static rendering - 3 pre-rendered SEO landing pages
- [ ] Open Graph + Twitter Card image - Designed 1200×630 share preview image
- [ ] Funnel analytics with privacy-friendly events - Track conversion funnel with Vercel Analytics
- [ ] Sentry error tracking - Frontend error monitoring
- [ ] "Disconnect & wipe local data" button - Trust-builder for clearing all local data

### Tier C — Long-Term / Strategic
- [ ] Backend with playlist version history - Vercel Functions + Neon Postgres for persistent snapshots
- [ ] Shareable sort links - Public URLs to share sort configurations
- [ ] Scheduled sorts - Recurring sorts with cron scheduling
- [ ] Spotify Web Playback preview snippets - Play 30-second previews on hover
- [ ] Shareable energy-curve PNG - Generate downloadable visualization images
- [ ] AI-assisted natural language sorting - Sort playlists with natural language prompts
- [ ] Apple Music adapter - Generalize to work with Apple Music
- [ ] Pro tier monetization with Stripe - $3/mo tier with premium features
- [ ] "Liked Songs" archive support - Support for Spotify's Liked Songs library

## 🔧 Improvements / Refactoring

### P2 — Quality / Maintainability
- [ ] Split Dashboard.tsx into smaller components - Extract PlaylistCover, AmbientBackdrop, SorterHeader, SortChips, TrackTable
- [ ] Add Vitest unit tests for pure utilities - Test sortTracks, removeDuplicateTracks, playlistColors
- [ ] Optimize savePlaylistTracks (O(n²) → O(n)) - Rewrite with Map for O(n) performance
- [ ] Fix typography & contrast issues - Fix emoji fonts, improve --text-3 contrast, fix disabled button cursors
- [ ] Mobile responsiveness for track table - Responsive layout for <600px screens
- [x] "Undo last sort" toast - 30-second undo window after applying sort
- [ ] Rethink undo toast notification UI - Reconsider layout, sizing, dismiss button placement, and overall visual design
- [ ] Show actual Spotify order on playlist load - Display tracks in their current Spotify order before any sort is applied, so users can see what they're starting from
- [ ] Reduce OAuth scope and turn off forced consent - Remove show_dialog parameter, audit scopes
- [ ] Sync / regenerate stale documentation - Update CLAUDE.md, README.md, todo.txt
- [ ] Add a minimal CI workflow - GitHub Actions for lint+build+test

### Operational
- [ ] Weekly digest email (requires backend) - Opt-in weekly recap of activity
- [ ] Public roadmap page - /roadmap page driven by GitHub Issues

## 📚 Documentation
- [ ] Update CLAUDE.md to reflect current source tree - Fix stale references to .jsx/.js, removed components
- [ ] Update README.md sort options - Match actual SORT_OPTIONS keys
- [ ] Add SCOPES documentation in spotifyConfig.ts - Explain what each OAuth scope is for
- [ ] Add privacy disclosure for playlist snapshots - Update privacy modal for backend storage
- [ ] Document monitoring setup in README - Sentry project setup instructions

## 💡 Ideas / Nice to Have
- [ ] Highlight active sort property across all sort options - Green styling in header button and track list columns
- [ ] Custom themes for Pro users - User-defined color schemes
- [ ] Collaborative playlists support - Multi-user sort sessions
- [ ] Export sort configurations as JSON - Import/export presets
- [ ] Browser extension for in-Spotify sorting - Native integration

## ✅ Completed
- [x] Created TODO.md template

---

## Notes

### Implementation Order (Suggested)
1. **Phase 0: Foundation** — P0 + P1 bug fixes (stable, secure baseline)
2. **Phase 1: Restore + Differentiate** — S1, S2, S3, S4 (match marketing, ship Smart Shuffle)
3. **Phase 2: Power Users** — A1, A2, A3, A4, A5 (multi-sort, filters, history, shortcuts)
4. **Phase 3: Distribution** — A6, B3, B4, B5 (PWA, SEO, OG, analytics)
5. **Phase 4: Trust & Polish** — B1, B2, B6, B7 (themes, i18n, monitoring, privacy)
6. **Phase 5: Strategic** — C1 → C9 (backend, sharing, AI, monetization)

### Priority Labels
- **P0** = Critical bugs blocking production
- **P1** = High-impact polish (security, UX, performance)
- **P2** = Quality / maintainability
- **Tier S** = Highest leverage features
- **Tier A** = High value, modest effort
- **Tier B** = Nice to have
- **Tier C** = Long-term / strategic

### Dependencies
- Smart Shuffle (S2) depends on ReccoBeats (S1)
- Sort presets (S3) works best with ReccoBeats (S1)
- Many Tier C features require backend (C1)
- AI sorting (C6) depends on ReccoBeats (S1) + Smart Shuffle (S2)
- Pro tier (C8) depends on backend (C1)