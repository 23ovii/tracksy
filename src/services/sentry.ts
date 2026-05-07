import * as Sentry from '@sentry/react';

const SENSITIVE_KEYS = /token|access_token|refresh_token|password|secret|key/i;

function scrubObject(obj: Record<string, unknown>): Record<string, unknown> {
  const scrubbed: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    scrubbed[k] = SENSITIVE_KEYS.test(k) ? '[Filtered]' : v;
  }
  return scrubbed;
}

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || import.meta.env.DEV) return;

  Sentry.init({
    dsn,
    environment: 'production',
    release: import.meta.env.VITE_APP_VERSION,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Scrub localStorage snapshot if Sentry captures it
      if (event.extra) {
        event.extra = scrubObject(event.extra as Record<string, unknown>);
      }
      if (event.request?.cookies) {
        event.request.cookies = '[Filtered]';
      }
      // Scrub any top-level extra fields that look like tokens
      if (event.contexts) {
        for (const [ctxKey, ctxVal] of Object.entries(event.contexts)) {
          if (ctxVal && typeof ctxVal === 'object') {
            (event.contexts as Record<string, unknown>)[ctxKey] = scrubObject(
              ctxVal as Record<string, unknown>
            );
          }
        }
      }
      return event;
    },
  });
}

export { Sentry };
