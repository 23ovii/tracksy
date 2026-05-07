import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '24px 28px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24,
    }}>
      <Link to="/privacy" style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
      >
        Privacy Policy
      </Link>
      <Link to="/settings" style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
      >
        Settings
      </Link>
    </footer>
  );
}

export default Footer;
