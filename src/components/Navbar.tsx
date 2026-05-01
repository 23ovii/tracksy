import { Link, NavLink } from 'react-router-dom';
import type { JSX, MouseEvent } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { buildSpotifyAuthUrl } from '../services/auth.ts';
import { useTheme } from '../hooks/useTheme.ts';
import type { Theme } from '../hooks/useTheme.ts';

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="4" />
    <line x1="12" y1="20" x2="12" y2="22" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="2" y1="12" x2="4" y2="12" />
    <line x1="20" y1="12" x2="22" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MonitorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const MoonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const THEME_OPTIONS: { value: Theme; label: string; Icon: () => JSX.Element }[] = [
  { value: 'light',  label: 'Light',  Icon: SunIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
  { value: 'dark',   label: 'Dark',   Icon: MoonIcon },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme"
      style={{
        display: 'inline-flex',
        border: '1px solid var(--border2)',
        borderRadius: 50,
        background: 'var(--bg-inset)',
        padding: 3,
        gap: 2,
      }}
    >
      {THEME_OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            aria-label={label}
            title={label}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 26, height: 26, borderRadius: 50,
              border: 'none',
              background: active ? 'var(--glass-bg)' : 'transparent',
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
              color: active ? 'var(--text)' : 'var(--text-3)',
              cursor: 'pointer',
              transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
            }}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}

function Navbar() {
  const { logout, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    window.location.href = await buildSpotifyAuthUrl();
  };

  return (
    <header style={{
      height: 'var(--nav-h)',
      borderBottom: '1px solid var(--nav-border)',
      background: 'var(--nav-bg)',
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

        <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isAuthenticated && [{ to: '/', label: 'Home', end: true }, { to: '/dashboard', label: 'Dashboard', end: false }].map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                position: 'relative',
                padding: '8px 16px', borderRadius: 50,
                background: isActive ? 'var(--border)' : 'transparent',
                color: isActive ? 'var(--text)' : 'var(--text-2)',
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                textDecoration: 'none',
                boxShadow: '0 0 0 1px transparent',
                transition: 'background 0.2s, color 0.2s, transform 0.2s var(--ease-out), box-shadow 0.2s',
              })}
              onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.color = 'var(--text)';
                e.currentTarget.style.boxShadow = '0 0 0 1px var(--border2)';
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

          <ThemeToggle />

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
                marginLeft: 4, padding: '7px 16px', borderRadius: 50,
                border: '1px solid var(--border2)', background: 'transparent',
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
                e.currentTarget.style.borderColor = 'var(--border2)';
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
