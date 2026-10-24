# Tracksy Improvements

Prioritized follow-up from the read-only codebase review on 2026-10-24. This is
an implementation tracker: check items off only after the change is made and
verified. Work through the phases in order, keeping each change focused and
validated.

## Progress

- [x] Ignore local dotenv files without ignoring `.env.example`.
- [x] Fix authentication lifecycle races and logout synchronization.
- [x] Make Spotify reorder failure/cancellation recover safely.
- [x] Update vulnerable dependencies and resolve ESLint peer compatibility.
- [ ] Correct user-facing feature and privacy claims.
- [ ] Address remaining correctness, accessibility, UX, and documentation work.
- [ ] Evaluate optional feature opportunities.

## Findings and actions

### Bugs & correctness

#### [x] B1 — Recover safely after failed or canceled playlist writes

- **Severity:** Medium · **Effort:** M
- **Location:** `src/services/spotify.ts:184-234`; `src/api/mutations.ts:45-48`; `src/pages/Dashboard.tsx:224-230,250-279,386-389`; `src/components/Toast.tsx:37-43`
- **Problem:** Spotify reorder requests run sequentially, so completed moves remain applied if a later request fails or is canceled. The UI says no changes were saved, and allows a retry while a query may still be fetching the authoritative order.
- **Suggested fix:** Explain that a partial update may have occurred; wait for/refetch Spotify order before enabling another write. Do not allow a retry using stale order data. Consider compensating completed moves where that is safe.
- **Change:** Failed writes wait for the Spotify playlist refetch before settling. Write and undo actions remain unavailable during refetch; failures explain that Spotify may have applied some moves, and cancellation messaging no longer claims that no changes were saved.
- **Verification:** `src/api/mutations.test.tsx` verifies a failed write waits for refetched Spotify order; `npm run validate` passed.

#### [x] B2 — Prevent a pending token refresh from restoring a logged-out session

- **Severity:** High · **Effort:** M
- **Location:** `src/auth/AuthProvider.tsx:59-85,147-150`
- **Problem:** A refresh request already in flight can complete after logout and call `applyToken`, persisting credentials again.
- **Suggested fix:** Tie each refresh to the active auth generation/session and discard results for superseded sessions; abort requests on cleanup when possible.
- **Change:** Refresh results and failures are ignored when their auth generation is no longer active; logout invalidates pending refreshes and removes the stored auth state immediately.
- **Verification:** `src/auth/AuthProvider.test.tsx` covers refresh completion after logout.

#### [x] B3 — Abort an in-flight reorder when leaving the dashboard

- **Severity:** Medium · **Effort:** S
- **Location:** `src/pages/Dashboard.tsx:63,250-279`; `src/components/Navbar.tsx:20-24,110`; `src/components/SortProgress.tsx:18-21`
- **Problem:** Reordering is canceled by the dashboard Back button only. Signing out/unmounting the page leaves the Spotify write running, and the progress completion timer is not cleaned up.
- **Suggested fix:** Abort the active operation on unmount and clean up the completion timer; reconcile actual order after abort.
- **Change:** Dashboard unmount aborts the active reorder and clears its toast timer; `SortProgress` clears its delayed completion timer when it becomes inactive or unmounts. Failed or canceled writes await playlist-query invalidation, and sorting remains disabled while Spotify order is being refetched.
- **Verification:** `src/components/SortProgress.test.tsx` covers timer cleanup on unmount; `src/api/mutations.test.tsx` covers waiting for Spotify reconciliation after a failed write.

#### [ ] B4 — Group discography tracks by album identity

- **Severity:** Medium · **Effort:** M
- **Location:** `src/utils/playlistUtils.ts:39-60,84-110`; `src/types.ts:1-12`; `src/services/spotify.types.ts`
- **Problem:** Albums are grouped by normalized album name alone, so unrelated albums with the same title can be merged and assigned a misleading canonical artist/size.
- **Suggested fix:** Carry Spotify album ID into the app track model and use it as the grouping key, with an explicit fallback for missing IDs.

#### [ ] B5 — Bound Spotify rate-limit retries

- **Severity:** Medium · **Effort:** S
- **Location:** `src/services/spotify.ts:117-125,217-225`
- **Problem:** A request receiving repeated 429 responses retries recursively without a maximum; its wait multiplier does not increase across retries of that same request.
- **Suggested fix:** Implement bounded retries with a capped backoff, honor `Retry-After`, and return a user-visible terminal error.

#### [ ] B6 — Avoid stale track rows after data refresh

- **Severity:** Low · **Effort:** S
- **Location:** `src/components/TrackItem.tsx:15,106-109`
- **Problem:** The memo comparator ignores displayed track fields. If a track keeps its ID and index while its metadata changes, the row may not rerender.
- **Suggested fix:** Compare displayed fields or use the track reference; retain custom memoization only if profiling demonstrates a benefit.

### Security

#### [x] S3 — Ignore local dotenv variants

- **Severity:** Medium · **Effort:** S
- **Location:** `.gitignore:4`; `.env.example`
- **Problem:** Only `.env` was ignored, leaving `.env.local` untracked and easy to stage accidentally. Local dotenv files may contain credentials such as the optional Edge Config connection string.
- **Change:** Ignore `.env*` and explicitly keep `.env.example` trackable.
- **Verification:** Confirmed `.env.local` is ignored and `.env.example` remains tracked.

#### [x] S1 — Update vulnerable transitive dependencies

- **Severity:** High · **Effort:** S/M
- **Location:** `package.json:28`; `package-lock.json` (locked `dompurify@3.4.2`, `fflate@0.4.8`, and development dependency tree)
- **Problem:** `npm audit` on 2026-10-24 reported high-severity DOMPurify advisories and a moderate fflate advisory in the production dependency tree, plus development-tree advisories for `brace-expansion`, `undici`, and `@babel/core`. The app does not directly import DOMPurify; reachability of affected SDK paths needs confirmation.
- **Suggested fix:** Update PostHog and regenerate the lockfile, or apply compatible overrides. Rerun the full audit and investigate affected SDK paths; avoid claiming reachability without evidence.
- **Change:** Updated vulnerable transitive packages in the lockfile with compatible releases; `npm audit fix` reports zero vulnerabilities. No claim is made that the prior advisories were reachable from app code.
- **Verification:** `npm audit` reports zero advisories; `npm ls` confirms the updated vulnerable package versions.

#### [ ] S2 — Reduce exposure from browser-persisted OAuth tokens

- **Severity:** Medium · **Effort:** L/M
- **Location:** `src/auth/AuthProvider.tsx:17,40-45`
- **Problem:** Access and refresh tokens are stored in JavaScript-readable localStorage, making them accessible to same-origin script execution. No direct XSS was identified in the reviewed source.
- **Suggested fix:** For stronger isolation, move token exchange/storage to a backend-for-frontend using secure HttpOnly cookies. If the client-only architecture remains, minimize scopes/lifetimes and document residual risk.

#### [x] S4 — Synchronize logout and avoid clearing unrelated storage

- **Severity:** Medium · **Effort:** S
- **Location:** `src/components/Navbar.tsx:20-24`; `src/auth/AuthProvider.tsx:40-45,88-108,147-150`
- **Problem:** `localStorage.clear()` emits a storage event with a null key, which the auth listener ignores. Other tabs can remain authenticated in memory; the call also clears storage owned by unrelated same-origin features.
- **Suggested fix:** Remove only app-owned keys, make logout remove the auth key synchronously, and handle a clear/broadcast logout event in other tabs.
- **Change:** Logout removes only Tracksy-owned storage keys; auth state listens for auth-key removal and storage-clear events from other tabs.
- **Verification:** `src/auth/AuthProvider.test.tsx` covers a cross-tab storage-clear event.

### Dead code

#### [ ] D1 — Remove unused image-generation dependencies

- **Severity:** Low · **Effort:** S
- **Location:** `package.json:35,58`; `scripts/generate-og.mjs`
- **Problem:** `satori` and `@resvg/resvg-js` are declared but no tracked app or script code imports them; the current OG generator uses Puppeteer.
- **Suggested fix:** Remove them if no external workflow relies on them, then regenerate the lockfile and validate.

### Code quality & architecture

#### [ ] Q1 — Separate dashboard operation lifecycle from page orchestration

- **Severity:** Low · **Effort:** M
- **Location:** `src/pages/Dashboard.tsx:29-380`
- **Problem:** The page coordinates selection, sorting, mutation, undo, progress, history, presets, shortcuts, and notifications. This makes operation lifecycle edge cases harder to isolate.
- **Suggested fix:** Extract focused hooks for reorder lifecycle and history/preset actions while leaving presentation in the page/components.

#### [ ] Q2 — Validate persisted and remote JSON at runtime

- **Severity:** Low · **Effort:** M
- **Location:** `src/auth/AuthProvider.tsx:20-30,93`; `src/services/spotify.ts:73-88`; `src/services/auth.ts:121`
- **Problem:** Parsed storage and API response values are asserted to application types rather than checked; malformed storage or changed API responses may enter core flows.
- **Suggested fix:** Validate auth state and required response fields before storing or consuming them.

### Performance

#### [ ] P1 — Bound and reduce sort-history storage

- **Severity:** Medium · **Effort:** M
- **Location:** `src/services/sortHistory.ts:6-8,25-42`; `src/pages/Dashboard.tsx:326-339`
- **Problem:** Each entry persists redundant ID and occurrence-key arrays. Five entries are capped per playlist but the number of playlists is unbounded, and the full map is serialized synchronously. Write/quota errors are silently ignored.
- **Suggested fix:** Stop writing redundant ID arrays for new entries, add a global storage bound, and surface persistence failures; consider IndexedDB if expected data volume warrants it.

### UI/UX & design

#### [ ] U1 — Distinguish library errors from an empty library

- **Severity:** Medium · **Effort:** S
- **Location:** `src/pages/Dashboard.tsx:386`; `src/components/dashboard/LibraryPanel.tsx:5-10,63-81`
- **Problem:** The panel only receives `isLoading`; a failed playlist request is displayed like a successful empty result.
- **Suggested fix:** Pass query error/retry state and render a distinct actionable error state.

#### [ ] U2 — Make Escape close only the topmost history UI

- **Severity:** Medium · **Effort:** S
- **Location:** `src/components/dashboard/SorterHeader.tsx:38-40`; `src/pages/Dashboard.tsx:189-191`
- **Problem:** The drawer and dashboard both handle Escape; one keypress can close history and navigate back to the library.
- **Suggested fix:** Centralize Escape handling or stop propagation when the drawer consumes it.

#### [ ] U3 — Add an empty-playlist state

- **Severity:** Low · **Effort:** S
- **Location:** `src/components/dashboard/TrackTable.tsx:199-214`
- **Problem:** A successfully loaded playlist with zero tracks renders an empty list without explanation.
- **Suggested fix:** Show a specific empty state distinct from loading and error states.

#### [ ] U4 — Fit the history drawer to small viewports

- **Severity:** Low · **Effort:** S
- **Location:** `src/components/dashboard/SorterHeader.tsx:205-212`
- **Problem:** The fixed 340px drawer can overflow screens narrower than its width.
- **Suggested fix:** Use a viewport-constrained width such as `min(340px, 100vw)` and verify its contents on mobile.

#### [ ] U5 — Show the diff preview only when the order changes

- **Severity:** Low · **Effort:** S
- **Location:** `src/pages/Dashboard.tsx` (diff map construction); `src/components/dashboard/TrackTable.tsx:81-92`
- **Problem:** The diff map includes zero-delta entries, so checking `diffMap.size > 0` shows the “moved” summary and preview toggle even when every track is unchanged.
- **Suggested fix:** Derive a `hasChanges` flag from nonzero deltas, or store only changed tracks in the map.

### Accessibility (a11y)

#### [ ] A1 — Do not hijack Enter on focused controls

- **Severity:** Medium · **Effort:** S
- **Location:** `src/hooks/useKeyboardShortcuts.ts:5-7,30-33`; `src/pages/Dashboard.tsx:184-188`
- **Problem:** The global Enter shortcut ignores inputs and textareas but not buttons/links. It prevents their normal Enter activation and triggers sort instead.
- **Suggested fix:** Ignore Enter on interactive elements or use a documented chord such as Ctrl+Enter.

#### [ ] A2 — Expose track and progress semantics to assistive technology

- **Severity:** Medium · **Effort:** M
- **Location:** `src/components/dashboard/TrackTable.tsx:170-214`; `src/components/SortProgress.tsx:24-52`
- **Problem:** The visual grid lacks table/row/header semantics, and the progress bar has no accessible role or current value.
- **Suggested fix:** Use a semantic table or appropriate ARIA grid/table structure and expose progress min/max/current values with an accessible status for rate limiting.

#### [ ] A3 — Announce active sort and direction

- **Severity:** Low · **Effort:** S
- **Location:** `src/components/dashboard/SortChips.tsx:29-50`
- **Problem:** The active sort and arrow are visual-only button states.
- **Suggested fix:** Add `aria-pressed` and an accessible label/state including direction.

### SEO & web fundamentals

#### [ ] E1 — Align marketing and social metadata with shipped sort options

- **Severity:** Medium · **Effort:** S
- **Location:** `index.html:9-17`; `src/pages/Home.tsx:22,169`; `src/components/dashboard/LibraryPanel.tsx:31`; `scripts/generate-og.mjs`
- **Problem:** Page and social copy and the OG image claim BPM, energy, or mood sorting, which is not implemented. Current sort options are title, artist, popularity, date added, duration, and discography.
- **Suggested fix:** Update copy to accurately describe the app and regenerate `public/tracksy-og.png`.

### Infrastructure & DevOps

#### [ ] I1 — Correct the Sentry privacy disclosure or add the integration

- **Severity:** Medium · **Effort:** S to correct copy; M to integrate
- **Location:** `src/pages/Privacy.tsx:123-128`; `src/components/ErrorBoundary.tsx:22-24`; `package.json`
- **Problem:** The privacy policy says crash reports are sent to Sentry, but no Sentry dependency or integration is present; the error boundary only logs to the console.
- **Suggested fix:** Remove the inaccurate statement or add a redacted, privacy-reviewed error reporting integration and document it accurately.

### Dependencies & compatibility

#### [x] D2 — Resolve ESLint 10 and jsx-a11y peer mismatch

- **Severity:** Medium · **Effort:** S/M
- **Location:** `package.json:47-50`; `.npmrc:1`; `eslint.config.js:4-5`
- **Problem:** `npm ls` reported ESLint 10 as invalid against `eslint-plugin-jsx-a11y@6.10.2`'s declared peer range (through ESLint 9). `legacy-peer-deps=true` suppresses that incompatibility.
- **Suggested fix:** Upgrade to a plugin version declaring ESLint 10 compatibility or pin ESLint 9; remove the peer-dependency override when the dependency tree is compatible.
- **Change:** Pinned ESLint and `@eslint/js` to the compatible ESLint 9 line and removed the legacy peer-dependency override.
- **Verification:** `npm ls eslint @eslint/js eslint-plugin-jsx-a11y` resolves without invalid peer warnings.

### Testing

#### [ ] T1 — Cover auth, reorder, UI states, and the Edge endpoint

- **Severity:** Medium · **Effort:** M
- **Location:** `src/auth/AuthProvider.tsx:59-85`; `src/pages/Dashboard.tsx:224-380`; `api/spotify-status.ts`; `tsconfig.json:20-24`; `package.json` (`lint` script)
- **Problem:** Existing tests cover utilities and service paths, but not React auth lifecycle, reorder recovery, key UI states, or the status endpoint. TypeScript excludes `api/`, and lint only checks `src`.
- **Suggested fix:** Add targeted tests for refresh-after-logout, cancel/failure reconciliation, and library empty/error states. Include `api/` in appropriate lint/type validation.

### Documentation & DX

#### [ ] D3 — Synchronize project guides and TODOs with the current source

- **Severity:** Medium · **Effort:** S/M
- **Location:** `AGENTS.md:56,67,73,124`; `CLAUDE.md:56,67,73,124`; `README.md:17,68-69`; `TODO.md:7-18,95`
- **Problem:** The guides refer to removed hooks/context/components, call strict TypeScript disabled although it is enabled, and list OAuth state/CI as missing although they exist. README also calls the current track-difference preview album-art preview.
- **Suggested fix:** Update/consolidate guides and prune TODO items against the actual source and CI configuration.

#### [ ] D4 — Make the OG generator portable

- **Severity:** Low · **Effort:** S
- **Location:** `scripts/generate-og.mjs`
- **Problem:** The generator hardcodes a local Windows Edge path and has no npm script, making it difficult to run on other systems or CI.
- **Suggested fix:** Configure the browser executable portably and add/document a named script if the generator is supported.

### Missing features & opportunities

#### [ ] M1 — Consider multi-key sorting

- **Severity:** Nice-to-have · **Effort:** M
- **Location:** `src/utils/playlistUtils.ts:3-4,25-36`; `src/services/presets.ts:4-12`
- **Problem:** Presets store one key, so users cannot specify deterministic secondary sort criteria for ties.
- **Suggested fix:** If user demand supports it, add an ordered list of sort keys and persist it in presets.

## Suggested order

1. **Now — secure and recover core operations:** B2, B3, B1, B5, S1, S4, S2, and T1.
2. **Next — correctness and accessible UX:** B4, B6, U1-U5, A1-A3, and E1.
3. **Then — maintainability and cleanup:** I1, D1-D4, Q1-Q2, and P1.
4. **Later — optional product work:** M1, after validating user need.

## Quick wins

- [x] Ignore `.env.local` and other local dotenv variants.
- [ ] Correct unsupported BPM/energy/mood copy and regenerate OG artwork.
- [ ] Remove the inaccurate Sentry disclosure if no integration is planned.
- [ ] Fix the diff preview visibility check for unchanged playlists.
- [ ] Add clear empty and playlist-load-error states.
- [ ] Remove unused image-generation dependencies if confirmed unnecessary.
- [ ] Fix Escape propagation from the history drawer.
- [ ] Add selected/direction state to sort buttons.

## Review health snapshot

Scores are from the review on 2026-10-24; revisit them as findings are resolved.

| Category | Score / 10 | Rationale |
|---|---:|---|
| Bugs & correctness | 5 | Core paths have tests, but auth and partial-write races remain. |
| Security | 5 | PKCE/state and headers are good; token storage, dotenv hygiene, and dependency advisories need attention. |
| Dead code | 8 | Little unused app code; two unused dev dependencies. |
| Code quality & architecture | 6 | Modular foundations, but dashboard orchestration and unchecked JSON add coupling. |
| Performance | 7 | Virtualized tracks and query caching help; history persistence can grow synchronously. |
| UI/UX & design | 6 | Useful flows, but fetch failures and empty states are ambiguous. |
| Accessibility | 5 | Focus traps exist, but keyboard and semantic-state gaps affect core controls. |
| SEO & web fundamentals | 4 | Metadata exists but advertises unsupported features. |
| Infrastructure & DevOps | 7 | CI, Vercel headers, and Dependabot are present; monitoring disclosure is inaccurate. |
| Dependencies & compatibility | 4 | Audit advisories and an ESLint peer mismatch. |
| Testing | 5 | 63 tests passed; React/auth flows and the Edge endpoint lack focused coverage. |
| Documentation & DX | 4 | Several guides and TODOs are stale. |
| Missing features & opportunities | 7 | The core sorter is focused; multi-key sorting is a realistic extension. |

## Validation baseline

- `npm run validate` — passed during the read-only review on 2026-10-24; 63 tests passed, with two non-blocking ESLint warnings.
- `npm run build` — passed during follow-up implementation on 2026-10-24; Vite reported that `analytics.ts` is statically imported as well as dynamically imported, so the module itself is not split by that dynamic import.
- `npm audit` — reported advisories in production and development dependency trees on 2026-10-24.
