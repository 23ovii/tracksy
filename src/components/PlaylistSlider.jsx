import { useState, useRef } from 'react';
import PlaylistCard from './PlaylistCard.jsx';

const CARD_W = 160;
const GAP = 10;

function PlaylistSlider({ playlists, selected, onSelect }) {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);
  const max = Math.max(0, playlists.length * (CARD_W + GAP) - (ref.current?.offsetWidth || 600));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
            Your Library
          </p>
          <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px' }}>
            Playlists
            <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>{playlists.length} total</span>
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[-1, 1].map((d) => (
            <button
              key={d}
              onClick={() => setOffset((o) => Math.max(0, Math.min(max, o + d * (CARD_W + GAP) * 3)))}
              style={{
                width: 28, height: 28, borderRadius: 50,
                border: '1px solid var(--border2)',
                background: 'var(--surface3)', color: 'var(--text)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {d === -1 ? <path d="M8 2L4 6l4 4" /> : <path d="M4 2l4 4-4 4" />}
              </svg>
            </button>
          ))}
        </div>
      </div>
      <div ref={ref} style={{ overflow: 'hidden' }}>
        <div style={{
          display: 'flex', gap: GAP,
          transform: `translateX(-${offset}px)`,
          transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
          width: playlists.length * (CARD_W + GAP),
        }}>
          {playlists.map((p) => (
            <div key={p.id} style={{ width: CARD_W, flexShrink: 0 }}>
              <PlaylistCard playlist={p} selected={selected} onClick={() => onSelect(p)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PlaylistSlider;
