# Project TODO
> Last updated: 2026-10-24

## 🔥 High Priority

### P0 — Critical Bugs
- [x] Resolve Tailwind source-detection task - Tailwind v4's Vite plugin auto-detects sources; the `--shadow-glow` token is defined in `src/styles/tailwind.css`
- [x] Align marketing copy with actually-shipped sort keys - Updated page/social copy and regenerated the Open Graph image
- [x] Add OAuth `state` parameter for CSRF protection - State is stored, returned, and verified in the OAuth callback
- [x] Guard `Callback.tsx` against React StrictMode double-invoke - A `useRef` guard prevents duplicate callback processing

### P1 — High-impact polish
- [ ] Replace array-index keys on TrackItem with stable IDs - Use track.id instead of array index
- [x] Re-enable react-hooks ESLint rules - `rules-of-hooks` and `exhaustive-deps` are enabled as warnings
- [x] Add CSP and security headers in vercel.json - Content-Security-Policy and security headers are configured
- [x] Add a top-level ErrorBoundary - `main.tsx` wraps the app in `ErrorBoundary`
- [x] Extract a `<ProtectedRoute>` wrapper - Dashboard route is protected by the reusable wrapper
- [x] Multi-tab sign-out sync - AuthProvider broadcasts logout across tabs

## 🐛 Bugs to Fix

### Track Identity & Validation
- [ ] Fix track identity mapping bug in savePlaylistTracks - Rekey Map by array index instead of object reference
- [x] Add input validation to Spotify response mapping - Playlist and track responses are validated before mapping

### Rate Limiting
- [x] Fix rate limit retry - Retry count is capped at 5
- [x] Bound rate-limit retry delays - Waits are capped at 60 seconds
- [x] Improve rate limit message UX - Retry status is shown and Apply is disabled during the operation

### Auth & Session
- [x] Add missing token validation in Callback.tsx - OAuth token responses are validated before login
- [ ] Add 401 re-auth handling - Detect 401 responses and redirect to login with message
- [ ] Fix silent logout on token refresh failure - Surface message to user before clearing auth state
- [ ] Add logout confirmation - Confirmation step before clearing auth state

### UI State
- [ ] Fix AbortController race condition in applySort - Abort previous request before creating new controller
- [x] Prevent spam-clicking Refresh playlists button - Refresh is disabled while fetching
- [x] Add empty playlist state - The track table distinguishes empty and unsupported-only playlists
- [ ] Cancel sort stays on playlist - When canceling an in-progress sort, show a notification and remain on the current playlist instead of navigating back

### Dead Code
- [x] Retire obsolete duplicate-removal task - No `removeDuplicateTracks` function exists; duplicate tracks are preserved and addressed by occurrence keys

## ✨ Features to Add

### Tier S — Highest Leverage
- [ ] Restore BPM, energy, and danceability via ReccoBeats - Re-implement audio features using ReccoBeats API
- [ ] Smart Shuffle: energy-curve ordering - Energy-curve sort with warm-up, peak, cool-down
- [x] Sort presets (saved configurations) - Save and re-apply sort configurations
- [x] Sort preview / diff visualization - Show per-track position changes before applying to Spotify

### Tier A — High Value, Modest Effort
- [ ] Multi-sort with tiebreakers - Stack up to 3 sort keys with priority order
- [ ] Filter before sort - Add filter bar (search, year range, popularity, duration)
- [x] Sort history (last 5 operations per playlist) - Persistent history with restore capability
- [ ] Playlist diff badges (what changed since last visit) - Badge playlists with +N −M indicators
- [x] Keyboard shortcuts + help overlay - Power-user shortcuts with discoverable help
- [ ] Make Tracksy a PWA - Installable with offline support and app icon

### Tier B — Nice to Have
- [x] Dark/light theme with system preference detection - Light and dark themes support system preference
- [ ] i18n with English + 4 starter locales - Add Spanish, Portuguese, French, German
- [ ] SEO landing pages with static rendering - 3 pre-rendered SEO landing pages
- [x] Open Graph + Twitter Card image - Generated 1200×630 share preview image
- [ ] Funnel analytics with privacy-friendly events - Track conversion funnel with Vercel Analytics
- [ ] Sentry error tracking - Frontend error monitoring
- [x] "Disconnect & wipe local data" button - Available from the account menu

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
- [x] Split Dashboard.tsx into smaller components - Dashboard components and operation hooks are extracted
- [x] Add Vitest tests for current pure utilities - Sort, track identity, and error utilities have focused tests
- [ ] Optimize savePlaylistTracks - Position maps make lookups O(1), but array splices and shifted-slot updates still cost O(distance) per move
- [ ] Fix typography & contrast issues - Fix emoji fonts, improve --text-3 contrast, fix disabled button cursors
- [ ] Mobile responsiveness for track table - Responsive layout for <600px screens
- [x] "Undo last sort" toast - 30-second undo window after applying sort
- [ ] Rethink undo toast notification UI - Reconsider layout, sizing, dismiss button placement, and overall visual design
- [ ] Show actual Spotify order on playlist load - Display tracks in their current Spotify order before any sort is applied, so users can see what they're starting from
- [ ] Reduce OAuth scope and turn off forced consent - Remove show_dialog parameter, audit scopes
- [x] Sync / regenerate stale documentation - Updated AGENTS.md, CLAUDE.md, README.md, and this TODO against current source
- [x] Add a minimal CI workflow - GitHub Actions runs `npm run validate` and `npm run build`

### Operational
- [ ] Weekly digest email (requires backend) - Opt-in weekly recap of activity
- [ ] Public roadmap page - /roadmap page driven by GitHub Issues

## 📚 Documentation
- [x] Update CLAUDE.md to reflect current source tree - Corrected data-fetching, type, and preview descriptions
- [x] Update README.md sort options - Lists all shipped sort options and current movement preview
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