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
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: 'var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(29,185,84,0.4)',
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M9 18V5l12-2v13" stroke="#000" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="6" cy="18" r="3" stroke="#000" strokeWidth="2.4" />
              <circle cx="18" cy="16" r="3" stroke="#000" strokeWidth="2.4" />
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px', color: 'var(--text)' }}>Tracksy</span>
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
