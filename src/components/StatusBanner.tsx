interface Props {
  message: string;
  onDismiss: () => void;
}

export default function StatusBanner({ message, onDismiss }: Props) {
  return (
    <div
      role="alert"
      style={{
        background: 'rgba(239,68,68,0.10)',
        borderBottom: '1px solid rgba(239,68,68,0.25)',
        padding: '9px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 13,
        position: 'relative',
        zIndex: 190,
      }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: '#ef4444',
        flexShrink: 0,
        animation: 'statusPulse 2s ease-in-out infinite',
      }} />

      <span style={{ fontWeight: 700, color: '#ef4444', whiteSpace: 'nowrap' }}>
        Spotify issues
      </span>

      <span style={{
        color: 'var(--text-2)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: 1,
      }}>
        {message}
      </span>

      <a
        href="https://x.com/spotifyStatus"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginLeft: 'auto',
          flexShrink: 0,
          color: '#ef4444',
          fontWeight: 600,
          fontSize: 12,
          textDecoration: 'underline',
          textUnderlineOffset: 2,
          opacity: 0.9,
        }}
      >
        Updates on X
      </a>

      <button
        aria-label="Dismiss"
        onClick={onDismiss}
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-3)',
          fontSize: 16,
          lineHeight: 1,
          padding: '2px 4px',
          borderRadius: 4,
          fontFamily: 'inherit',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; }}
      >
        ✕
      </button>

      <style>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
      `}</style>
    </div>
  );
}
