import { useState, useEffect } from 'react';
import type { JSX, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { buildSpotifyAuthUrl } from '../services/auth.ts';
import { trackEvent, TrackEvents } from '../services/analytics';
import PrivacyModal from '../components/PrivacyModal';

interface Feature {
  label: string;
  sub: string;
  tag: 'Live' | 'Soon';
  icon: JSX.Element;
  accent: string;
}

const FEATURES: Feature[] = [
  {
    label: 'Playlist Sorter',
    sub: 'BPM · energy · mood',
    tag: 'Live',
    accent: '#1db954',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M3 6h18" /><path d="M6 12h12" /><path d="M10 18h4" />
      </svg>
    ),
  },
  {
    label: 'Duplicate Finder',
    sub: 'Clean your library',
    tag: 'Soon',
    accent: '#e8622a',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="9" y="9" width="11" height="11" rx="2" /><rect x="4" y="4" width="11" height="11" rx="2" />
      </svg>
    ),
  },
  {
    label: 'Playlist Merger',
    sub: 'Combine & dedupe',
    tag: 'Soon',
    accent: '#9b72f5',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M7 4v5c0 4 5 4 5 8v3" /><path d="M17 4v5c0 4-5 4-5 8" />
      </svg>
    ),
  },
  {
    label: 'Smart Shuffle',
    sub: 'Flow-aware ordering',
    tag: 'Soon',
    accent: '#1e8ac4',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M16 3h5v5" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /><path d="M16 21h5v-5" /><path d="M21 21l-7-7" /><path d="M3 3l7 7" />
      </svg>
    ),
  },
];

// animated equalizer — visual flourish
const EQ_BARS = [0.55, 0.9, 0.4, 0.75, 0.5, 0.85, 0.6, 0.35, 0.7];

function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    trackEvent(TrackEvents.LANDING_VIEW);
  }, []);

  const handleLogin = async () => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }
    trackEvent(TrackEvents.OAUTH_START);
    setIsLoading(true);
    setError('');
    try {
      window.location.href = await buildSpotifyAuthUrl();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const ctaHover = (e: MouseEvent<HTMLButtonElement>, on: boolean) => {
    if (isLoading) return;
    e.currentTarget.style.transform = on ? 'translateY(-2px)' : '';
    e.currentTarget.style.boxShadow = on
      ? '0 14px 44px rgba(29,185,84,0.55), 0 0 0 1px rgba(255,255,255,0.1) inset'
      : '0 6px 28px rgba(29,185,84,0.35), 0 0 0 1px rgba(255,255,255,0.08) inset';
  };

  return (
    <>
    <div style={{
      minHeight: 'calc(100vh - var(--nav-h))',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Decorative floating equalizer — top right */}
      <div aria-hidden style={{
        position: 'absolute', top: 110, right: '-2%',
        display: 'flex', alignItems: 'flex-end', gap: 10, height: 220,
        pointerEvents: 'none', opacity: 0.5,
      }}>
        {EQ_BARS.map((h, i) => (
          <div key={i} style={{
            width: 12, height: `${h * 100}%`,
            borderRadius: 6,
            background: `linear-gradient(180deg, rgba(90,245,160,0.9), rgba(29,185,84,0.2))`,
            boxShadow: '0 0 12px rgba(29,185,84,0.3)',
            transformOrigin: 'bottom',
            animation: `barPulse ${1.2 + i * 0.18}s ease-in-out infinite`,
            animationDelay: `${i * 0.08}s`,
            willChange: 'transform',
          }} />
        ))}
      </div>

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        padding: '32px 28px 40px',
      }}>
      <div style={{
        maxWidth: 1140, width: '100%', margin: '0 auto',
        position: 'relative', zIndex: 2,
        animation: 'fadeUp 0.6s var(--ease-out)',
      }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 36,
          background: 'rgba(29,185,84,0.1)',
          border: '1px solid rgba(29,185,84,0.22)',
          borderRadius: 50, padding: '6px 14px 6px 8px',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--green)',
            display: 'inline-block', boxShadow: '0 0 10px var(--green)',
            animation: 'glow 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', letterSpacing: '0.02em' }}>
            Spotify playlist multitool
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(44px, 7.5vw, 88px)',
          fontWeight: 900, letterSpacing: '-3px', lineHeight: 0.98,
          marginBottom: 28,
          maxWidth: 900,
        }}>
          Sort your playlists<br />
          <span style={{
            background: 'linear-gradient(92deg, #1db954 0%, #5af5a0 55%, #a0f5cd 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontStyle: 'italic', fontWeight: 800, letterSpacing: '-3.5px',
          }}>the smart way.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 1.4vw, 19px)',
          color: 'var(--text-2)', lineHeight: 1.6,
          maxWidth: 560, marginBottom: 44,
        }}>
          Connect Spotify and reorder any playlist by BPM, energy, popularity, or mood — then push it back in one click.
        </p>

        {/* CTA row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
          <button
            onClick={handleLogin}
            disabled={isLoading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 11,
              background: 'linear-gradient(180deg, #22c962, #159743)',
              color: '#000',
              border: 'none', borderRadius: 50, padding: '15px 30px',
              fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 6px 28px rgba(29,185,84,0.35), 0 0 0 1px rgba(255,255,255,0.08) inset',
              transition: 'transform 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out)',
              opacity: isLoading ? 0.7 : 1,
              letterSpacing: '-0.1px',
            }}
            onMouseEnter={(e) => ctaHover(e, true)}
            onMouseLeave={(e) => ctaHover(e, false)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.65 14.42c-.19.31-.6.41-.91.22-2.49-1.52-5.63-1.87-9.32-1.02-.36.08-.72-.14-.8-.5-.08-.36.14-.72.5-.8 4.04-.92 7.51-.52 10.31 1.19.31.19.41.6.22.91zm1.24-2.77c-.24.38-.75.51-1.13.27-2.85-1.75-7.19-2.26-10.56-1.24-.44.13-.9-.12-1.03-.56-.13-.44.12-.9.56-1.03 3.84-1.17 8.61-.6 11.89 1.43.38.24.51.75.27 1.13zm.11-2.89c-3.42-2.03-9.07-2.22-12.33-1.23-.52.16-1.07-.14-1.23-.66-.16-.52.14-1.07.66-1.23C8.9 6.76 15.12 6.98 19 9.3c.47.28.63.89.35 1.36-.28.47-.89.62-1.35.35v-.15z" />
            </svg>
            {isLoading ? 'Connecting…' : 'Connect with Spotify'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-3)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Free · Open source · Takes 5 seconds
          </div>
        </div>

        {error && (
          <div style={{
            maxWidth: 520,
            padding: '12px 16px', borderRadius: 12,
            border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.12)',
            fontSize: 13, color: 'var(--error-text)',
          }}>{error}</div>
        )}

        {/* Feature cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14, marginTop: 48, maxWidth: 980,
        }}>
          {FEATURES.map((f, i) => {
            const isLive = f.tag === 'Live';
            return (
              <div key={f.label} style={{
                position: 'relative',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '18px 20px',
                transition: 'transform 0.22s var(--ease-out), border-color 0.22s, background 0.22s',
                cursor: 'default',
                animation: `fadeUp 0.5s var(--ease-out) ${0.2 + i * 0.05}s both`,
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = 'translateY(-3px)';
                el.style.borderColor = `${f.accent}55`;
                el.style.background = 'var(--surface3)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = '';
                el.style.borderColor = 'var(--border)';
                el.style.background = 'var(--surface2)';
              }}>
                {/* Accent bar */}
                <div aria-hidden style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                  background: `linear-gradient(90deg, transparent, ${f.accent}, transparent)`,
                  opacity: isLive ? 0.9 : 0.35,
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${f.accent}18`, color: f.accent,
                    border: `1px solid ${f.accent}33`,
                  }}>{f.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.2px' }}>{f.label}</div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    color: isLive ? f.accent : 'var(--text-3)',
                    background: isLive ? `${f.accent}18` : 'var(--border)',
                    borderRadius: 50, padding: '3px 8px',
                  }}>{f.tag.toUpperCase()}</span>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>{f.sub}</p>
              </div>
            );
          })}
        </div>
      </div>
      </div>

      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '18px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10,
        position: 'relative', zIndex: 2,
      }}>
        {/* Left — copyright + attribution */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            © {new Date().getFullYear()} Tracksy
          </span>
          <span style={{ fontSize: 12, color: 'var(--border2)' }}>·</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Built by{' '}
            <a
              href="https://23ovii.dev"
              target="_blank"
              rel="noreferrer"
              style={{
                color: 'var(--text-2)', textDecoration: 'none', fontWeight: 500,
                transition: 'color 0.18s',
              }}
              onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = 'var(--green)'; }}
              onMouseLeave={(e: MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = 'var(--text-2)'; }}
            >
              23ovii.dev
            </a>
          </span>
        </div>

        {/* Right — links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <a
            href="https://open.spotify.com"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'none', transition: 'color 0.18s' }}
            onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = 'var(--text-2)'; }}
            onMouseLeave={(e: MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = 'var(--text-3)'; }}
          >
            Built for Spotify
          </a>
          <span style={{ fontSize: 12, color: 'var(--border2)' }}>·</span>
          <button
            onClick={() => setShowPrivacy(true)}
            style={{
              background: 'none', border: 'none', padding: 0,
              fontSize: 12, color: 'var(--text-3)', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'color 0.18s',
            }}
            onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-2)'; }}
            onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-3)'; }}
          >
            Privacy
          </button>
        </div>
      </footer>
    </div>
    {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </>
  );
}

export default Home;
