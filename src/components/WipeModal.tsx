import { FocusTrap } from 'focus-trap-react';

interface WipeModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

function WipeModal({ onClose, onConfirm }: WipeModalProps) {
  return (
    <FocusTrap focusTrapOptions={{ allowOutsideClick: true, escapeDeactivates: false }}>
      <div
        role="presentation"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="wipe-modal-title"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '28px 32px',
            maxWidth: 460,
            width: '100%',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}>
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
              onClick={onConfirm}
              className="tk-modal-danger"
              style={{
                padding: '8px 20px', borderRadius: 50,
                border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.1)',
                color: '#ef4444', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Wipe &amp; disconnect
            </button>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}

function CancelButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="tk-modal-ghost"
      style={{
        padding: '8px 20px', borderRadius: 50,
        border: '1px solid var(--border2)', background: 'transparent',
        color: 'var(--text-2)', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

export default WipeModal;
