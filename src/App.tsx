import { Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Navbar from './components/Navbar.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Home from './pages/Home.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Callback from './pages/Callback.tsx';
import ShortcutsOverlay from './components/ShortcutsOverlay.tsx';
import { ShortcutsOverlayProvider } from './context/ShortcutsOverlayContext.tsx';

function App() {
  return (
    <ShortcutsOverlayProvider>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
        <Navbar />
        <ShortcutsOverlay />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/callback" element={<Callback />} />
          <Route path="*" element={<Home />} />
        </Routes>
        <Analytics />
        <SpeedInsights />
      </div>
    </ShortcutsOverlayProvider>
  );
}

export default App;
