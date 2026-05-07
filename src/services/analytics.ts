import { track as vaTrack } from '@vercel/analytics';

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
    vaTrack(event, properties);
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
    } else {
      localStorage.removeItem('tracksy_analytics_disabled');
    }
  } catch { /* ignore */ }
}
