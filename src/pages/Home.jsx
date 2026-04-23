import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { buildSpotifyAuthUrl } from '../services/auth.js';

const FEATURES = [
  { label: 'Playlist Sorter', tag: 'Live' },
  { label: 'Duplicate Finder', tag: 'Soon' },
  { label: 'Playlist Merger', tag: 'Soon' },
  { label: 'Smart Shuffle', tag: 'Soon' },
];

function Home() {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      window.location.href = await buildSpotifyAuthUrl();
    } catch (err) {
      console.error(err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - var(--nav-h))',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 28px',
      background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(29,185,84,0.12), transparent)',
    }}>
      <div style={{ maxWidth: 900, width: '100%', animation: 'fadeUp 0.5s ease' }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32,
          background: 'var(--green-dim)', border: '1px solid rgba(29,185,84,0.2)',
          borderRadius: 50, padding: '6px 14px 6px 8px',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--green)',
            display: 'inline-block', boxShadow: '0 0 8px var(--green)',
            animation: 'glow 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>Spotify playlist multitool</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(42px, 6vw, 72px)',
          fontWeight: 900, letterSpacing: '-2.5px', lineHeight: 1.05,
          marginBottom: 24,
        }}>
          Sort your playlists<br />
          <span style={{
            background: 'linear-gradient(90deg, var(--green), #5af5a0)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>the smart way.</span>
        </h1>

        <p style={{ fontSize: 18, color: 'var(--text-2)', lineHeight: 1.7, maxWidth: 520, marginBottom: 40 }}>
          Connect Spotify and sort any playlist by BPM, energy, popularity, or mood — then push it back in one click.
        </p>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button
            onClick={handleLogin}
            disabled={isLoading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'var(--green)', color: '#000',
              border: 'none', borderRadius: 50, padding: '14px 28px',
              fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: isLoading ? 'default' : 'pointer',
              boxShadow: '0 4px 28px rgba(29,185,84,0.35)',
              transition: 'transform 0.15s, box-shadow 0.15s',
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 36px rgba(29,185,84,0.45)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 28px rgba(29,185,84,0.35)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.65 14.42c-.19.31-.6.41-.91.22-2.49-1.52-5.63-1.87-9.32-1.02-.36.08-.72-.14-.8-.5-.08-.36.14-.72.5-.8 4.04-.92 7.51-.52 10.31 1.19.31.19.41.6.22.91zm1.24-2.77c-.24.38-.75.51-1.13.27-2.85-1.75-7.19-2.26-10.56-1.24-.44.13-.9-.12-1.03-.56-.13-.44.12-.9.56-1.03 3.84-1.17 8.61-.6 11.89 1.43.38.24.51.75.27 1.13zm.11-2.89c-3.42-2.03-9.07-2.22-12.33-1.23-.52.16-1.07-.14-1.23-.66-.16-.52.14-1.07.66-1.23C8.9 6.76 15.12 6.98 19 9.3c.47.28.63.89.35 1.36-.28.47-.89.62-1.35.35v-.15z" />
            </svg>
            {isLoading ? 'Connecting…' : 'Connect with Spotify'}
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Free · No tracking</span>
        </div>

        {error && (
          <div style={{
            marginTop: 16, padding: '12px 16px', borderRadius: 12,
            border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)',
            fontSize: 13, color: '#fca5a5',
          }}>{error}</div>
        )}

        {/* Feature strip */}
        <div style={{ display: 'flex', gap: 12, marginTop: 64, flexWrap: 'wrap' }}>
          {FEATURES.map((f) => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 50, padding: '8px 14px',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{f.label}</span>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: f.tag === 'Live' ? 'var(--green)' : 'var(--text-3)',
                background: f.tag === 'Live' ? 'var(--green-dim)' : 'rgba(255,255,255,0.04)',
                borderRadius: 50, padding: '2px 7px',
              }}>{f.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
