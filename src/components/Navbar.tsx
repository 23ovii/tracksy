import { Link, NavLink, useNavigate } from 'react-router-dom';
import type { JSX, MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { buildSpotifyAuthUrl } from '../services/auth.ts';
import { useTheme } from '../hooks/useTheme.ts';
import type { Theme } from '../hooks/useTheme.ts';
import { trackEvent, TrackEvents } from '../services/analytics.ts';

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

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const THEME_OPTIONS: { value: Theme; label: string; Icon: () => JSX.Element }[] = [
  { value: 'light',  label: 'Light',  Icon: SunIcon },
  { value: 'dark',   label: 'Dark',   Icon: MoonIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
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
        padding: 2,
        gap: 1,
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
              width: 22, height: 22, borderRadius: 50,
              border: active ? '1px solid var(--toggle-active-border)' : '1px solid transparent',
              background: active ? 'var(--toggle-active-bg)' : 'transparent',
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.25)' : 'none',
              color: active ? 'var(--text)' : 'var(--text-3)',
              cursor: 'pointer',
              transition: 'background 0.18s, color 0.18s, box-shadow 0.18s, border-color 0.18s',
            }}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}

type WipeModalStep = 'confirm' | 'done';

function WipeModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [step, setStep] = useState<WipeModalStep>('confirm');

  const handleConfirm = () => {
    onConfirm();
    setStep('done');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wipe-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '28px 32px',
        maxWidth: 460,
        width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        {step === 'confirm' ? (
          <>
            <h2 id="wipe-modal-title" style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
              Disconnect &amp; wipe data?
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)' }}>
              This signs you out and clears all locally cached data:
            </p>
            <ul style={{ margin: '0 0 16px', paddingLeft: 20, fontSize: 14, lineHeight: 1.8, color: 'var(--text-2)' }}>
              <li>Presets &amp; sort history</li>
              <li>Audio-features cache &amp; snapshot diffs</li>
              <li>Theme preference</li>
              <li>Analytics opt-out preference</li>
            </ul>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 20px', borderRadius: 50,
                  border: '1px solid var(--border2)', background: 'transparent',
                  color: 'var(--text-2)', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'border-color 0.18s, color 0.18s',
                }}
                onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.borderColor = 'var(--text-3)';
                  e.currentTarget.style.color = 'var(--text)';
                }}
                onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.borderColor = 'var(--border2)';
                  e.currentTarget.style.color = 'var(--text-2)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  padding: '8px 20px', borderRadius: 50,
                  border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.1)',
                  color: '#ef4444', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'border-color 0.18s, background 0.18s',
                }}
                onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.8)';
                  e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                }}
                onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)';
                  e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                }}
              >
                Wipe &amp; disconnect
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="wipe-modal-title" style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
              All clear
            </h2>
            <p style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)' }}>
              Your local data has been wiped and you&apos;ve been signed out.
            </p>
            <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)' }}>
              To fully revoke Tracksy&apos;s access on Spotify&apos;s side, visit your{' '}
              <a
                href="https://www.spotify.com/account/apps"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--green)', textDecoration: 'underline', fontWeight: 500 }}
              >
                Spotify app permissions
              </a>{' '}
              and remove Tracksy.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 20px', borderRadius: 50,
                  border: '1px solid var(--border2)', background: 'transparent',
                  color: 'var(--text-2)', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'border-color 0.18s, color 0.18s',
                }}
                onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.borderColor = 'var(--text-3)';
                  e.currentTarget.style.color = 'var(--text)';
                }}
                onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.borderColor = 'var(--border2)';
                  e.currentTarget.style.color = 'var(--text-2)';
                }}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface AccountMenuProps {
  avatarUrl: string | null;
  displayName: string | null;
  onSignOut: () => void;
  onWipe: () => void;
}

function AccountMenu({ avatarUrl, displayName, onSignOut, onWipe }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: globalThis.MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative', marginLeft: 4 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34, borderRadius: 50, padding: 0,
          border: open ? '2px solid var(--green)' : '2px solid var(--border2)',
          background: 'var(--surface2)',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'border-color 0.18s',
        }}
        onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
          if (!open) e.currentTarget.style.borderColor = 'rgba(29,185,84,0.6)';
        }}
        onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
          if (!open) e.currentTarget.style.borderColor = 'var(--border2)';
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName ?? 'Account'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ color: 'var(--text-3)', display: 'flex' }}>
            <UserIcon />
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            minWidth: 220,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            zIndex: 300,
          }}
        >
          {displayName && (
            <>
              <div style={{ padding: '10px 16px 8px', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.01em' }}>
                {displayName}
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
            </>
          )}

          <div style={{ padding: '7px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Theme</span>
            <ThemeToggle />
          </div>

          <div style={{ height: 1, background: 'var(--border)' }} />

          <button
            role="menuitem"
            onClick={() => { setOpen(false); onSignOut(); }}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 16px',
              border: 'none', background: 'transparent',
              color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.14s, color 0.14s',
            }}
            onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.background = 'var(--border)';
              e.currentTarget.style.color = 'var(--text)';
            }}
            onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-2)';
            }}
          >
            Sign out
          </button>

          <div style={{ height: 1, background: 'var(--border)' }} />

          <button
            role="menuitem"
            onClick={() => { setOpen(false); onWipe(); }}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 16px',
              border: 'none', background: 'transparent',
              color: '#ef4444', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.14s',
            }}
            onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
            }}
            onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Disconnect &amp; wipe data
          </button>
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const { logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showWipeModal, setShowWipeModal] = useState(false);

  const handleLogin = async () => {
    window.location.href = await buildSpotifyAuthUrl();
  };

  const handleSignOut = () => {
    logout();
  };

  const handleWipeConfirm = () => {
    trackEvent(TrackEvents.ACCOUNT_WIPED);
    logout();
    localStorage.clear();
    sessionStorage.clear();
    navigate('/');
  };

  const avatarUrl = user?.images?.[0]?.url ?? null;
  const displayName = user?.display_name ?? null;

  return (
    <>
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
              <AccountMenu
                avatarUrl={avatarUrl}
                displayName={displayName}
                onSignOut={handleSignOut}
                onWipe={() => setShowWipeModal(true)}
              />
            )}
          </nav>
        </div>
      </header>

      {showWipeModal && (
        <WipeModal onClose={() => setShowWipeModal(false)} onConfirm={handleWipeConfirm} />
      )}
    </>
  );
}

export default Navbar;
