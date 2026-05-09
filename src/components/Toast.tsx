interface ToastProps {
  msg: string;
  type?: 'cancel';
  stacked?: boolean;
}

function Toast({ msg, type, stacked }: ToastProps) {
  const bottom = stacked ? 96 : 32;

  if (type === 'cancel') {
    return (
      <div style={{
        position: 'fixed', bottom, left: '50%', transform: 'translateX(-50%)',
        zIndex: 101,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 20px 12px 14px',
        background: 'var(--glass-bg)',
        border: '1px solid rgba(239,68,68,0.22)',
        borderLeft: '3px solid rgba(239,68,68,0.65)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(239,68,68,0.12), var(--shadow-card)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        animation: 'toastIn 0.28s var(--ease-out)',
        whiteSpace: 'nowrap',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M9 3L3 9M3 3l6 6" stroke="rgba(239,68,68,0.9)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--error-text)', lineHeight: 1.3 }}>
            Sort canceled
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>
            No changes were saved to Spotify
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom, left: '50%', transform: 'translateX(-50%)',
      zIndex: 101,
      background: 'var(--glass-bg)',
      border: '1px solid var(--border2)',
      borderRadius: 10,
      boxShadow: 'var(--shadow-card)',
      padding: '9px 18px',
      fontSize: 13, color: 'var(--text)', fontWeight: 500,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      animation: 'toastIn 0.25s var(--ease-out)',
      whiteSpace: 'nowrap',
    }}>
      {msg}
    </div>
  );
}

export default Toast;
