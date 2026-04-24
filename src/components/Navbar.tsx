import { Link, NavLink } from 'react-router-dom';
import type { MouseEvent } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';

function Navbar() {
  const { logout, isAuthenticated } = useAuth();

  return (
    <header style={{
      height: 'var(--nav-h)',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(10,13,18,0.85)',
      backdropFilter: 'blur(24px)',
      position: 'sticky', top: 0, zIndex: 200,
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 1140, margin: '0 auto',
        padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          textDecoration: 'none',
        }}>
          <img src="/tracksy-mark-green.png" alt="Tracksy" style={{ width: 28, height: 28 }} />
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>
            <span style={{ color: 'var(--text)' }}>track</span><span style={{ color: 'var(--green)' }}>sy</span>
          </span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[{ to: '/', label: 'Home', end: true }, { to: '/dashboard', label: 'Dashboard', end: false }].map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
              padding: '7px 16px', borderRadius: 50,
              background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: isActive ? 'var(--text)' : 'var(--text-2)',
              fontSize: 13, fontWeight: 500,
              textDecoration: 'none',
              transition: 'background 0.15s, color 0.15s',
            })}>
              {label}
            </NavLink>
          ))}
          {isAuthenticated && (
            <button
              onClick={logout}
              style={{
                marginLeft: 8, padding: '7px 16px', borderRadius: 50,
                border: '1px solid var(--border2)', background: 'transparent',
                color: 'var(--text-2)', fontFamily: 'inherit', fontSize: 13,
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--green)'; }}
              onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--border2)'; }}
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
