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
            className="tk-link"
            style={{ color: 'var(--text-2)', textDecoration: 'none', fontWeight: 500 }}
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
          className="tk-muted-link"
          style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}
        >
          Built for Spotify
        </a>
        <span style={{ fontSize: 12, color: 'var(--border2)' }}>·</span>
        <Link
          to="/privacy"
          className="tk-muted-link"
          style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}
        >
          Privacy
        </Link>
      </div>
    </footer>
  );
}

export default Footer;
