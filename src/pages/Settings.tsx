import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAnalyticsDisabled, setAnalyticsDisabled } from '../services/analytics';

function Settings() {
  const [disabled, setDisabled] = useState(() => getAnalyticsDisabled());

  function handleToggle() {
    const next = !disabled;
    setDisabled(next);
    setAnalyticsDisabled(next);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 'calc(var(--nav-h) + 48px)', paddingBottom: 80 }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.8px', color: 'var(--text)', marginBottom: 40 }}>
          Settings
        </h1>

        {/* Analytics toggle */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          borderRadius: 16,
          padding: '20px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
              Usage analytics
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
              Help improve Tracksy by sharing anonymous usage data.{' '}
              <Link to="/privacy" style={{ color: 'var(--green)', textDecoration: 'none' }}>
                Privacy Policy
              </Link>
            </div>
            {disabled && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8, fontStyle: 'italic' }}>
                Analytics are disabled. No data is being sent.
              </div>
            )}
          </div>
          <button
            role="switch"
            aria-checked={!disabled}
            aria-label="Toggle usage analytics"
            onClick={handleToggle}
            style={{
              width: 44, height: 24, borderRadius: 12, flexShrink: 0,
              background: disabled ? 'var(--border2)' : 'var(--green)',
              border: 'none', cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <span style={{
              position: 'absolute',
              top: 3, left: disabled ? 3 : 23,
              width: 18, height: 18, borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              transition: 'left 0.18s var(--ease-out)',
            }} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
