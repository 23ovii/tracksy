import './instrument';

import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Sentry.ErrorBoundary
          fallback={({ error, eventId }) => (
            <div className="flex w-full justify-center p-6">
              <section className="w-full max-w-3xl rounded-3xl border border-slate-700 bg-white/5 p-10 text-center text-slate-200 shadow-glow">
                <p className="text-sm uppercase tracking-[0.32em] text-spotify-green">Error</p>
                <h2 className="mt-6 text-3xl font-semibold text-white">Something went wrong</h2>
                <p className="mt-4 font-mono text-xs text-slate-400">
                  {(error as Error)?.message}
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
                  <button
                    onClick={() => window.location.reload()}
                    className="rounded-full bg-spotify-green px-6 py-2 text-sm font-semibold text-black hover:bg-green-400"
                  >
                    Reload page
                  </button>
                  {eventId && (
                    <button
                      onClick={() => Sentry.showReportDialog({ eventId })}
                      className="rounded-full border border-slate-600 px-6 py-2 text-sm font-semibold text-slate-200 hover:border-slate-400"
                    >
                      Report issue
                    </button>
                  )}
                </div>
              </section>
            </div>
          )}
          showDialog
        >
          <App />
        </Sentry.ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
