import { useState } from 'react';
import type { MouseEvent } from 'react';

type Step = 'confirm' | 'done';

interface WipeModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

function WipeModal({ onClose, onConfirm }: WipeModalProps) {
  const [step, setStep] = useState<Step>('confirm');

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
              <CancelButton onClick={onClose} label="Cancel" />
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
              <CancelButton onClick={onClose} label="Close" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CancelButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
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
      {label}
    </button>
  );
}

export default WipeModal;
