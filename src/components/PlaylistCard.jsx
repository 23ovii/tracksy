function PlaylistCard({ playlist, selected, onClick }) {
  const isSelected = selected?.id === playlist.id;

  return (
    <button
      onClick={onClick}
      style={{
        color: 'var(--text)',
        background: isSelected ? 'var(--surface3)' : 'var(--surface2)',
        border: `1px solid ${isSelected ? playlist.color1 + '88' : 'var(--border)'}`,
        borderRadius: 14,
        padding: 0,
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        overflow: 'hidden',
        boxShadow: isSelected ? `0 0 0 1px ${playlist.color1}44, 0 8px 32px rgba(0,0,0,0.4)` : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
        width: '100%',
      }}
      onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--border2)'; } }}
      onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--border)'; } }}
    >
      <div style={{
        height: 100,
        background: `linear-gradient(135deg, ${playlist.color1}cc, ${playlist.color2}aa)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', width: 90, height: 90, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', right: -20, top: -20,
        }} />
        <div style={{
          position: 'absolute', width: 60, height: 60, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', left: 10, bottom: -20,
        }} />
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M9 18V5l12-2v13" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6" cy="18" r="3" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" />
          <circle cx="18" cy="16" r="3" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" />
        </svg>
        {isSelected && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            width: 20, height: 20, borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{
          fontWeight: 700, fontSize: 13,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 4,
        }}>{playlist.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{playlist.trackCount} tracks</div>
      </div>
    </button>
  );
}

export default PlaylistCard;
