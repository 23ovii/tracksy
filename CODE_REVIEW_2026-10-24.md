# Tracksy Code Review — 2026-10-24

Read-only review of `origin/main` at `a1b0683` (`revert: multi-key sorting (#139)`). No source files were changed during the review. The working tree had six untracked branding PNGs; they were not reviewed or modified. Deployed provider behavior was not tested.

## Project overview

Tracksy is a client-side React/TypeScript SPA for sorting Spotify playlists and writing the new order back to Spotify. `src/main.tsx` boots the app and `src/App.tsx` defines routes and app-wide UI. Auth, Spotify queries/mutations, services, hooks, components, and pages are organized under `src/`; `api/` contains a Vercel Edge Function for Spotify status.

The stack is React 19, TypeScript, Vite, React Router, TanStack Query, Spotify OAuth PKCE/API, PostHog, Vercel Analytics and Speed Insights, and Vercel Edge Config. GitHub Actions runs validation and a production build; Vercel serves the SPA and API function.

## Findings

### Security

#### S1 — Analytics opt-out does not cover every provider

- **Severity:** Medium · **Effort:** M
- **Location:** `src/App.tsx:4-5,64-69`; `src/services/analytics.ts:17-22,63-88`; `src/pages/Privacy.tsx:161-164`
- **Problem:** The privacy switch controls PostHog, but Vercel Analytics and Speed Insights are mounted independently. The UI says “No data is being sent” when opted out. Also, if saving the opt-out preference to `localStorage` throws, the catch skips PostHog’s `opt_out_capturing()` call.
- **Suggested fix:** Define which providers the opt-out covers and apply it consistently, or label the toggle as PostHog-only. Make runtime opt-out independent of storage success. Confirm deployed SDK behavior.

#### S2 — Privacy disclosures need verification against provider settings

- **Severity:** Medium · **Effort:** S
- **Location:** `src/pages/Privacy.tsx:88-95,123-127`; `src/services/analytics.ts:29-40`
- **Problem:** The policy says browser/device type and IP are not collected because autocapture is disabled, while also saying Vercel Analytics collects device and country statistics. PostHog autocapture is disabled, but IP capture is not explicitly disabled in this configuration; the current wording is not established by the source alone.
- **Suggested fix:** Verify each provider’s settings, disable any collection the policy excludes, and align the policy with confirmed behavior.

### Bugs & correctness

#### B1 — Profile lookup failure appears as an empty playlist library

- **Severity:** Medium · **Effort:** M
- **Location:** `src/auth/AuthProvider.tsx:141-158`; `src/components/ProtectedRoute.tsx:10-17`; `src/api/playlists.ts:14-19`; `src/components/dashboard/LibraryPanel.tsx:65-66,116-120`
- **Problem:** If Spotify `/me` fails while the token remains valid, auth remains active but `user` is null, so the playlist query is disabled. The dashboard shows “No playlists found” instead of an error or retry. This is a misleading empty state, not an indefinite loading state.
- **Suggested fix:** Track profile loading/error separately and offer retry or re-authentication instead of rendering the empty-library state.

#### B2 — Transient token-refresh errors silently sign the user out

- **Severity:** Medium · **Effort:** M
- **Location:** `src/auth/AuthProvider.tsx:101-110`
- **Problem:** Every refresh failure clears auth, including temporary network/server errors, without an explanation.
- **Suggested fix:** Retry transient failures with bounded backoff and show an actionable message. Clear auth when the refresh token is definitively invalid.

#### B3 — Sort history trusts valid but malformed JSON

- **Severity:** Low · **Effort:** S
- **Location:** `src/services/sortHistory.ts:18-24,81-90`
- **Problem:** Parsed storage is not shape-checked. For example, a stored `null` can make `getHistory()` throw, and malformed playlist values can break history updates.
- **Suggested fix:** Validate the top-level object, per-playlist arrays, and entry fields before use. Add tests for malformed JSON shapes.

### UI/UX

#### U1 — Wipe dialog lists data not present in the current app

- **Severity:** Low · **Effort:** S
- **Location:** `src/components/WipeModal.tsx:40-46`; `src/components/Navbar.tsx:20-32`
- **Problem:** The dialog promises to clear an “Audio-features cache & snapshot diffs,” but the wipe handler only removes the listed app storage keys; no such feature appears in the tracked source.
- **Suggested fix:** Remove the stale bullet or update it to match the data actually cleared.

### Accessibility

#### A1 — Track filter has no programmatic accessible name

- **Severity:** Medium · **Effort:** S
- **Location:** `src/components/dashboard/TrackTable.tsx:147-151`
- **Problem:** The filter relies on placeholder text, which is not a reliable accessible name.
- **Suggested fix:** Add a visible associated `<label>` or an `aria-label`.

#### A2 — Selected theme is only indicated visually

- **Severity:** Low · **Effort:** S
- **Location:** `src/components/AccountMenu.tsx:64-75`
- **Problem:** Theme buttons have accessible labels but do not expose which option is selected.
- **Suggested fix:** Add `aria-pressed={active}` to each theme button.

### Infrastructure & DevOps

#### I1 — Status-service failures are reported as operational

- **Severity:** Low · **Effort:** S
- **Location:** `api/spotify-status.ts:12-14`; `src/hooks/useSpotifyStatus.ts:15-19`
- **Problem:** Edge Config errors return `{ isDown: false }`, and client fetch failures are ignored. Users cannot distinguish “Spotify is up” from “status is unknown.”
- **Suggested fix:** Represent an unknown status separately and show a neutral unavailable state while keeping the app usable.

### Documentation & DX

#### D1 — Contributor guide has stale file references

- **Severity:** Low · **Effort:** S
- **Location:** `CLAUDE.md:122,174`
- **Problem:** The guide lists `PlaylistSlider.tsx`, which is absent from the tracked tree, and calls the Vite config `vite.config.js` although the file is `vite.config.ts`.
- **Suggested fix:** Correct the component list and config filename.

## Review notes

- No high-confidence dead-code or dependency vulnerability finding surfaced.
- The client-only auth architecture still exposes tokens to same-origin JavaScript through `sessionStorage`; a backend-for-frontend with HttpOnly cookies would be needed to remove that exposure.
- The initial dashboard view is title-sorted, but the active Title chip and movement preview provide cues that this is a proposed order. Confusion with Spotify’s current order is a possible UX risk, not a demonstrated defect.
- `npm run validate` passed: TypeScript passed, 22 test files and 119 tests passed. ESLint reported two non-blocking Fast Refresh warnings.
- `npm run build` passed. Vite reported an ineffective dynamic import of the analytics wrapper because it is also statically imported; the PostHog SDK is still dynamically imported.
- `npm audit` reported zero vulnerabilities.

## Highest-impact improvements

Ordered by impact relative to effort:

1. Make the analytics opt-out reliable and explicitly define which providers it covers.
2. Verify privacy disclosures against provider settings and correct them.
3. Show a profile-fetch error and retry instead of “No playlists found.”
4. Preserve sessions across transient token-refresh failures.
5. Validate sort-history storage before consuming or updating it.
6. Add an accessible name to the track filter.
7. Expose selected theme state to assistive technology.
8. Remove the stale data claim from the wipe dialog.
9. Distinguish “status unavailable” from “Spotify operational.”
10. Correct stale contributor-guide references.

## Quick wins

- Label the track filter.
- Add `aria-pressed` to the theme buttons.
- Remove the stale wipe-dialog bullet.
- Correct the contributor-guide filenames.
- Add malformed-history validation and focused tests.

## Suggested roadmap

- **Now:** Resolve analytics opt-out behavior and privacy wording; handle profile lookup and token-refresh failures.
- **Next:** Validate persisted sort history; fix accessibility and stale-copy findings.
- **Later:** Improve status-unknown feedback and consider auth architecture changes based on the project’s threat model.

## Health snapshot

| Category | Score / 10 | Rationale |
|---|---:|---|
| Bugs & correctness | 7 | Core flows are well tested; auth failure states and persisted history still have gaps. |
| Security | 7 | PKCE and CSP are solid; analytics controls and disclosures need alignment. |
| Dead code | 8 | No confirmed unused source code or dependencies; one stale UI claim remains. |
| Code quality & architecture | 8 | Clear service/hook boundaries and focused components. |
| Performance | 8 | Query caching, route splitting, and virtualization are in place. |
| UI/UX & design | 7 | Strong core flows; a profile failure can look like an empty account. |
| Accessibility | 7 | Focus and sort semantics are covered; filter naming and theme state need attention. |
| SEO & web fundamentals | 8 | Metadata and OG assets are present; SEO is naturally limited for an authenticated SPA. |
| Infrastructure & DevOps | 8 | CI, Vercel configuration, and security headers are present; status failures are masked. |
| Dependencies & compatibility | 9 | Audit found no vulnerabilities; toolchain checks pass. |
| Testing | 8 | 119 tests pass, with privacy and some failure-state paths still untested. |
| Documentation & DX | 8 | Setup and project guidance are strong, with a few stale references. |
| Missing features & opportunities | 7 | Core sorting is complete; multi-key sorting remains deferred after the earlier revert. |
