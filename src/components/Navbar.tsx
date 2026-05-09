import { Link, NavLink, useNavigate } from 'react-router-dom';
import type { MouseEvent } from 'react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { buildSpotifyAuthUrl } from '../services/auth.ts';
import { trackEvent, TrackEvents } from '../services/analytics.ts';
import AccountMenu from './AccountMenu.tsx';
import WipeModal from './WipeModal.tsx';

function Navbar() {
  const { logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showWipeModal, setShowWipeModal] = useState(false);

  const handleLogin = async () => {
    window.location.href = await buildSpotifyAuthUrl();
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
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
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
            {isAuthenticated && [
              { to: '/', label: 'Home', end: true },
              { to: '/dashboard', label: 'Dashboard', end: false },
            ].map(({ to, label, end }) => (
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
                onSignOut={logout}
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
