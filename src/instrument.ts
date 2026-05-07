import * as Sentry from '@sentry/react';
import React from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

const SENSITIVE_KEYS = /token|access_token|refresh_token|password|secret|key/i;

function scrubObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = SENSITIVE_KEYS.test(k) ? '[Filtered]' : v;
  }
  return result;
}

const dsn = import.meta.env.VITE_SENTRY_DSN;

// Expose Sentry globally for console testing — remove after confirming
if (typeof window !== 'undefined') {
  (window as any).Sentry = Sentry;
}
if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
    sendDefaultPii: true,
    integrations: [
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1,
    tracePropagationTargets: [
      /^https:\/\/tracksy\.vercel\.app/,
      /^https:\/\/tracksy\.app/,
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enableLogs: true,
    beforeSend(event) {
      if (event.extra) {
        event.extra = scrubObject(event.extra as Record<string, unknown>);
      }
      if (event.request?.cookies) {
        event.request.cookies = '[Filtered]';
      }
      if (event.contexts) {
        for (const [k, v] of Object.entries(event.contexts)) {
          if (v && typeof v === 'object') {
            (event.contexts as Record<string, unknown>)[k] = scrubObject(
              v as Record<string, unknown>
            );
          }
        }
      }
      return event;
    },
  });
}
