import { Link, NavLink } from 'react-router-dom';
import type { MouseEvent } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { buildSpotifyAuthUrl } from '../services/auth.ts';
import { useShortcutsOverlay } from '../context/ShortcutsOverlayContext.tsx';

function Navbar() {
  const { logout, isAuthenticated } = useAuth();
  const { toggle: toggleShortcuts } = useShortcutsOverlay();

  const handleLogin = async () => {
    window.location.href = await buildSpotifyAuthUrl();
  };

  return (
    <header style={{
      height: 'var(--nav-h)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(7, 10, 15, 0.82)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      position: 'sticky', top: 0, zIndex: 200,
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 1180, margin: '0 auto',
        padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          textDecoration: 'none',
        }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(29,185,84,0.22), rgba(29,185,84,0.04))',
            border: '1px solid rgba(29,185,84,0.35)',
            boxShadow: '0 0 24px rgba(29,185,84,0.28), 0 0 0 1px rgba(255,255,255,0.04) inset',
          }}>
            <img src="/tracksy-mark-green.png" alt="Tracksy" style={{ width: 26, height: 26, filter: 'drop-shadow(0 0 6px rgba(29,185,84,0.5))' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.6px' }}>
            <span style={{ color: 'var(--text)' }}>track</span><span style={{ color: 'var(--green)' }}>sy</span>
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
            color: 'var(--text-3)', border: '1px solid var(--border2)',
            borderRadius: 4, padding: '2px 5px', marginLeft: 2,
          }}>BETA</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            onClick={toggleShortcuts}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
              color: 'var(--text-3)', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.18s, color 0.18s, background 0.18s',
              marginRight: 4,
            }}
            onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.24)';
              e.currentTarget.style.color = 'var(--text-2)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
            onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'var(--text-3)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ?
          </button>
          {isAuthenticated && [{ to: '/', label: 'Home', end: true }, { to: '/dashboard', label: 'Dashboard', end: false }].map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                position: 'relative',
                padding: '8px 16px', borderRadius: 50,
                background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: isActive ? 'var(--text)' : 'var(--text-2)',
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                textDecoration: 'none',
                boxShadow: '0 0 0 1px transparent',
                transition: 'background 0.2s, color 0.2s, transform 0.2s var(--ease-out), box-shadow 0.2s',
              })}
              onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.color = 'var(--text)';
                e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e: MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.color = '';
                e.currentTarget.style.boxShadow = '0 0 0 1px transparent';
              }}
            >
              {label}
            </NavLink>
          ))}
          {!isAuthenticated && (
            <button
              onClick={handleLogin}
              style={{
                marginLeft: 4, padding: '7px 18px', borderRadius: 50,
                border: '1px solid rgba(29,185,84,0.45)', background: 'rgba(29,185,84,0.08)',
                color: 'var(--green)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                transition: 'border-color 0.18s, background 0.18s, transform 0.18s',
              }}
              onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.borderColor = 'rgba(29,185,84,0.8)';
                e.currentTarget.style.background = 'rgba(29,185,84,0.16)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.borderColor = 'rgba(29,185,84,0.45)';
                e.currentTarget.style.background = 'rgba(29,185,84,0.08)';
                e.currentTarget.style.transform = '';
              }}
            >
              Sign In
            </button>
          )}
          {isAuthenticated && (
            <button
              onClick={logout}
              style={{
                marginLeft: 10, padding: '7px 16px', borderRadius: 50,
                border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                color: 'var(--text-2)', fontFamily: 'inherit', fontSize: 13,
                cursor: 'pointer',
                transition: 'border-color 0.18s, color 0.18s, background 0.18s',
              }}
              onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.borderColor = 'rgba(29,185,84,0.5)';
                e.currentTarget.style.color = 'var(--green)';
                e.currentTarget.style.background = 'rgba(29,185,84,0.06)';
              }}
              onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = 'var(--text-2)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Sign Out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
