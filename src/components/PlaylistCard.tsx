import type { MouseEvent } from 'react';
import type { Playlist } from '../types';

interface PlaylistCardProps {
  playlist: Playlist;
  selected: Playlist | null;
  onClick: () => void;
}

function PlaylistCard({ playlist, selected, onClick }: PlaylistCardProps) {
  const isSelected = selected?.id === playlist.id;

  return (
    <button
      onClick={onClick}
      style={{
        color: 'var(--text)',
        background: isSelected ? 'rgba(32, 42, 58, 0.9)' : 'rgba(18, 24, 34, 0.85)',
        border: `1px solid ${isSelected ? playlist.color1 + '88' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 16,
        padding: 0,
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        overflow: 'hidden',
        boxShadow: isSelected
          ? `0 0 0 1px ${playlist.color1}44, 0 18px 40px -16px ${playlist.color1}66, 0 2px 0 rgba(255,255,255,0.04) inset`
          : '0 12px 30px -20px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.03) inset',
        transition: 'transform 0.2s var(--ease-out), border-color 0.18s, box-shadow 0.2s',
        width: '100%',
        position: 'relative',
      }}
      onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.borderColor = playlist.color1 + '55';
          e.currentTarget.style.boxShadow = `0 1px 0 rgba(255,255,255,0.05) inset`;
          const overlay = e.currentTarget.querySelector('[data-overlay]') as HTMLElement | null;
          if (overlay) overlay.style.opacity = '1';
        }
      }}
      onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
        if (!isSelected) {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.boxShadow = '0 12px 30px -20px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.03) inset';
          const overlay = e.currentTarget.querySelector('[data-overlay]') as HTMLElement | null;
          if (overlay) overlay.style.opacity = '0';
        }
      }}
    >
      <div style={{
        height: 116,
        background: `linear-gradient(135deg, ${playlist.color1}, ${playlist.color2})`,
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {playlist.imageUrl ? (
          <img
            src={playlist.imageUrl}
            alt={playlist.name}
            loading="lazy"
            decoding="async"
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            }}
          />
        ) : (
          <>
            <div style={{
              position: 'absolute', width: 120, height: 120, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', right: -30, top: -30,
            }} />
            <div style={{
              position: 'absolute', width: 70, height: 70, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)', left: 12, bottom: -18,
            }} />
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M9 18V5l12-2v13" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="6" cy="18" r="3" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" />
              <circle cx="18" cy="16" r="3" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" />
            </svg>
          </>
        )}

        {/* Inner vignette */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.35) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Hover overlay — play chip */}
        {!isSelected && (
          <div data-overlay aria-hidden style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)',
            opacity: 0,
            transition: 'opacity 0.25s var(--ease-out)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#000">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {isSelected && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            width: 22, height: 22, borderRadius: '50%',
            background: playlist.color1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 14px ${playlist.color1}aa`,
          }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{
          fontWeight: 700, fontSize: 13,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 3, letterSpacing: '-0.1px',
        }}>{playlist.name}</div>
        <div style={{
          fontSize: 11, color: 'var(--text-3)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{
            width: 4, height: 4, borderRadius: '50%',
            background: isSelected ? playlist.color1 : 'var(--text-3)',
          }} />
          {playlist.trackCount} tracks
        </div>
      </div>
    </button>
  );
}

export default PlaylistCard;
