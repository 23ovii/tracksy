import { useState, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { getAnalyticsDisabled, setAnalyticsDisabled } from '../services/analytics';

interface PrivacyModalProps {
  onClose: () => void;
}

function PrivacyModal({ onClose }: PrivacyModalProps) {
  const [disabled, setDisabled] = useState(() => getAnalyticsDisabled());

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handleToggle() {
    const next = !disabled;
    setDisabled(next);
    setAnalyticsDisabled(next);
  }

  function handleBackdropClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
        animation: 'fadeIn 0.18s var(--ease-out)',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--surface)',
        border: '1px solid var(--border2)',
        borderRadius: 20,
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        animation: 'fadeUp 0.22s var(--ease-out)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 0',
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px', margin: 0 }}>
            Privacy
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'var(--border)', border: 'none',
              color: 'var(--text-2)', fontSize: 16, lineHeight: 1,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
            Tracksy uses <strong style={{ color: 'var(--text)' }}>Vercel Analytics</strong> to understand how the app is used — things like how many playlists are sorted or how often the undo feature is used.
          </p>

          <ul style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <li>No track names, playlist names, or user IDs are ever collected.</li>
            <li>No data is sold or shared with third parties.</li>
            <li>Events contain only counts and category labels.</li>
            <li>Your Spotify account is never linked to analytics data.</li>
          </ul>

          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, margin: 0 }}>
            You can opt out at any time. Your preference is saved in your browser.
          </p>

          {/* Toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
          }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>
                {disabled ? 'Analytics disabled' : 'Analytics enabled'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                {disabled ? 'No usage data is sent.' : 'Anonymous usage data is collected.'}
              </div>
            </div>
            <button
              role="switch"
              aria-checked={!disabled}
              onClick={handleToggle}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: disabled ? 'var(--border2)' : 'var(--green)',
                border: 'none', cursor: 'pointer',
                position: 'relative', flexShrink: 0,
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
    </div>
  );
}

export default PrivacyModal;
