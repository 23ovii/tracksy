import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

import Navbar from './components/Navbar.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Home from './pages/Home.tsx';
import ShortcutsOverlay from './components/ShortcutsOverlay.tsx';
import StatusBanner from './components/StatusBanner.tsx';
import { ShortcutsOverlayProvider } from './context/ShortcutsOverlayContext.tsx';
import { trackPageview } from './services/analytics';
import { useSpotifyStatus } from './hooks/useSpotifyStatus';

const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const Callback = lazy(() => import('./pages/Callback.tsx'));
const Privacy = lazy(() => import('./pages/Privacy.tsx'));

function RouteFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 24px' }}>
      <span style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '2px solid var(--border2)', borderTopColor: 'var(--green)',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );
}

function App() {
  const location = useLocation();
  const { isDown, message } = useSpotifyStatus();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    trackPageview();
  }, [location]);

  // Un-dismiss if Spotify goes down again after recovering
  useEffect(() => {
    if (isDown) setDismissed(false);
  }, [isDown]);

  return (
    <ShortcutsOverlayProvider>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
        <Navbar />
        {isDown && !dismissed && (
          <StatusBanner message={message} onDismiss={() => setDismissed(true)} />
        )}
        <ShortcutsOverlay />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/callback" element={<Callback />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
        <Analytics />
        <SpeedInsights />
      </div>
    </ShortcutsOverlayProvider>
  );
}

export default App;
