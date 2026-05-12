import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

// Init analytics after first paint — posthog-js stays out of the initial bundle
const startAnalytics = () => import('./services/analytics').then(m => m.initAnalytics()).catch(() => {});
if ('requestIdleCallback' in window) (window as Window & typeof globalThis).requestIdleCallback(startAnalytics);
else setTimeout(startAnalytics, 1500);
