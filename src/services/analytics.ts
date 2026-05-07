import posthog from 'posthog-js';

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    autocapture: false,
    capture_pageview: false,
    persistence: 'memory', // no cookies = no banner needed
    disable_session_recording: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '.sensitive',
      recordCrossOriginIframes: false,
    },
  });
}

export const TrackEvents = {
  LANDING_VIEW: 'landing_view',
  OAUTH_START: 'oauth_start',
  OAUTH_COMPLETE: 'oauth_complete',
  OAUTH_ERROR: 'oauth_error',
  PLAYLISTS_LOADED: 'playlists_loaded',
  PLAYLIST_SELECTED: 'playlist_selected',
  SORT_PICKED: 'sort_picked',
  SORT_APPLIED: 'sort_applied',
  SORT_UNDONE: 'sort_undone',
  PRESET_SAVED: 'preset_saved',
  PRESET_APPLIED: 'preset_applied',
  FILTER_APPLIED: 'filter_applied',
  SHORTCUT_USED: 'shortcut_used',
  ACCOUNT_WIPED: 'account_wiped',
} as const;

type TrackEventName = typeof TrackEvents[keyof typeof TrackEvents];

function isOptedOut(): boolean {
  try {
    return localStorage.getItem('tracksy_analytics_disabled') === 'true';
  } catch {
    return false;
  }
}

export function trackEvent(event: TrackEventName, properties?: Record<string, string | number>): void {
  if (isOptedOut()) return;
  try {
    posthog.capture(event, properties);
  } catch (error) {
    console.error('Analytics tracking failed:', error);
  }
}

export function getAnalyticsDisabled(): boolean {
  return isOptedOut();
}

export function setAnalyticsDisabled(disabled: boolean): void {
  try {
    if (disabled) {
      localStorage.setItem('tracksy_analytics_disabled', 'true');
      posthog.opt_out_capturing();
    } else {
      localStorage.removeItem('tracksy_analytics_disabled');
      posthog.opt_in_capturing();
    }
  } catch { /* ignore */ }
}

if (import.meta.env.DEV) {
  (window as any).posthog = posthog;
  (window as any).trackEvent = trackEvent;
}