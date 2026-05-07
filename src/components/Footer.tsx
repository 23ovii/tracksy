import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '18px 28px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 10,
      position: 'relative', zIndex: 2,
    }}>
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
            style={{ color: 'var(--text-2)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.18s' }}
            onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = 'var(--green)'; }}
            onMouseLeave={(e: MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = 'var(--text-2)'; }}
          >
            23ovii.dev
          </a>
        </span>
      </div>

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
        <Link
          to="/privacy"
          style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'none', transition: 'color 0.18s' }}
          onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = 'var(--text-2)'; }}
          onMouseLeave={(e: MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = 'var(--text-3)'; }}
        >
          Privacy
        </Link>
        <span style={{ fontSize: 12, color: 'var(--border2)' }}>·</span>
        <Link
          to="/settings"
          style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'none', transition: 'color 0.18s' }}
          onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = 'var(--text-2)'; }}
          onMouseLeave={(e: MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = 'var(--text-3)'; }}
        >
          Settings
        </Link>
      </div>
    </footer>
  );
}

export default Footer;
