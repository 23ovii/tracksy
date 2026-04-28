import { useState, useRef, useEffect } from 'react';
import type { MouseEvent } from 'react';
import PlaylistCard from './PlaylistCard.tsx';
import type { Playlist } from '../types';

interface PlaylistSliderProps {
  playlists: Playlist[];
  selected: Playlist | null;
  onSelect: (playlist: Playlist) => void;
}

const CARD_W = 172;
const GAP = 14;

function PlaylistSlider({ playlists, selected, onSelect }: PlaylistSliderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(600);

  useEffect(() => {
    if (!ref.current) return;
    const update = () => setViewportWidth(Math.round(ref.current?.offsetWidth || 600));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const contentWidth = playlists.length * (CARD_W + GAP) - GAP;
  const max = Math.round(Math.max(0, contentWidth - viewportWidth));
  const atStart = offset <= 0;
  const atEnd = offset >= max - 2;

  const step = (d: -1 | 1) => setOffset((o) =>
    Math.round(Math.max(0, Math.min(max, o + d * (CARD_W + GAP) * 3)))
  );

  const navBtn = (dir: -1 | 1, disabled: boolean) => (
    <button
      onClick={() => step(dir)}
      disabled={disabled}
      aria-label={dir === -1 ? 'Previous' : 'Next'}
      style={{
        width: 34, height: 34, borderRadius: 50,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(18, 24, 34, 0.9)',
        color: disabled ? 'var(--text-3)' : 'var(--text)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'opacity 0.2s, border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = 'rgba(29,185,84,0.5)';
          e.currentTarget.style.background = 'rgba(29,185,84,0.08)';
        }
      }}
      onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.background = 'rgba(18, 24, 34, 0.7)';
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {dir === -1 ? <path d="M8 2L4 6l4 4" /> : <path d="M4 2l4 4-4 4" />}
      </svg>
    </button>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, padding: '0 4px' }}>
        <div>
          <p style={{
            fontSize: 10, fontWeight: 700, color: 'var(--green)',
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 5,
          }}>
            Your Library
          </p>
          <h2 style={{
            fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px',
            display: 'flex', alignItems: 'baseline', gap: 10,
          }}>
            Playlists
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', letterSpacing: 0 }}>
              {playlists.length} total
            </span>
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {navBtn(-1, atStart)}
          {navBtn(1, atEnd)}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <div ref={ref} style={{ overflow: 'hidden', padding: '4px 0' }}>
          <div style={{
            display: 'flex', gap: GAP,
            transform: `translateX(-${Math.round(offset)}px)`,
            transition: 'transform 0.5s var(--ease-out)',
            width: contentWidth,
          }}>
            {playlists.map((p) => (
              <div key={p.id} style={{ width: CARD_W, flexShrink: 0 }}>
                <PlaylistCard playlist={p} selected={selected} onClick={() => onSelect(p)} />
              </div>
            ))}
          </div>
        </div>

        {/* Edge fades */}
        {!atStart && (
          <div aria-hidden style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 40,
            background: 'linear-gradient(90deg, rgba(10,13,18,0.9), transparent)',
            pointerEvents: 'none',
          }} />
        )}
        {!atEnd && (
          <div aria-hidden style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 40,
            background: 'linear-gradient(270deg, rgba(10,13,18,0.9), transparent)',
            pointerEvents: 'none',
          }} />
        )}
      </div>
    </div>
  );
}

export default PlaylistSlider;
