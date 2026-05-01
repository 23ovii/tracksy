import type { Playlist } from '../../types';

interface AmbientBackdropProps {
  playlist: Playlist | null;
}

function AmbientBackdrop({ playlist }: AmbientBackdropProps) {
  if (!playlist) return null;
  return (
    <div aria-hidden style={{
      position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
      animation: 'fadeIn 0.5s var(--ease-out)',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 55% 50% at 20% 15%, ${playlist.color1}66, transparent 60%),
          radial-gradient(ellipse 60% 55% at 80% 85%, ${playlist.color2}55, transparent 60%)
        `,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'var(--ambient-overlay)',
      }} />
    </div>
  );
}

export default AmbientBackdrop;
