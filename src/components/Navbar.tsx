import { Link, NavLink } from 'react-router-dom';
import type { MouseEvent } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';

function Navbar() {
  const { logout, isAuthenticated } = useAuth();

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
            width: 30, height: 30,
            borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(29,185,84,0.15), rgba(29,185,84,0.02))',
            border: '1px solid rgba(29,185,84,0.25)',
            boxShadow: '0 0 18px rgba(29,185,84,0.18)',
          }}>
            <img src="/tracksy-mark-green.png" alt="Tracksy" style={{ width: 20, height: 20 }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.4px' }}>
            <span style={{ color: 'var(--text)' }}>track</span><span style={{ color: 'var(--green)' }}>sy</span>
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
            color: 'var(--text-3)', border: '1px solid var(--border2)',
            borderRadius: 4, padding: '2px 5px', marginLeft: 4,
          }}>BETA</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[{ to: '/', label: 'Home', end: true }, { to: '/dashboard', label: 'Dashboard', end: false }].map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
              position: 'relative',
              padding: '8px 16px', borderRadius: 50,
              background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: isActive ? 'var(--text)' : 'var(--text-2)',
              fontSize: 13, fontWeight: isActive ? 600 : 500,
              textDecoration: 'none',
              transition: 'background 0.2s, color 0.2s',
            })}>
              {label}
            </NavLink>
          ))}
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
