import type { Playlist } from '../../types';

interface PlaylistCoverProps {
  playlist: Playlist;
  size?: number;
}

function PlaylistCover({ playlist, size = 56 }: PlaylistCoverProps) {
  const radius = size * 0.18;
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: `linear-gradient(135deg, ${playlist.color1}, ${playlist.color2})`,
      boxShadow: `0 20px 40px -16px ${playlist.color1}99, 0 0 0 1px rgba(255,255,255,0.08) inset`,
      overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    }}>
      {playlist.imageUrl ? (
        <img
          src={playlist.imageUrl}
          alt={playlist.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <svg width={size * 0.38} height={size * 0.38} viewBox="0 0 24 24" fill="none">
          <path d="M9 18V5l12-2v13" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6" cy="18" r="3" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
          <circle cx="18" cy="16" r="3" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
        </svg>
      )}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.25))',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

export default PlaylistCover;
