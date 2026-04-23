import { useState } from 'react';
import PlaylistCard from './PlaylistCard.jsx';

const PAGE_SIZE = 8;

function PlaylistGrid({ playlists, selected, onSelect }) {
  const [page, setPage] = useState(0);
  const total = Math.ceil(playlists.length / PAGE_SIZE);
  const visible = playlists.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
            Your Library
          </p>
          <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px' }}>
            Playlists
            <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>{playlists.length} total</span>
          </h2>
        </div>
        {total > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{page + 1} / {total}</span>
            {[-1, 1].map((d) => (
              <button
                key={d}
                onClick={() => setPage((p) => p + d)}
                disabled={d === -1 ? page === 0 : page === total - 1}
                style={{
                  width: 28, height: 28, borderRadius: 50,
                  border: '1px solid var(--border2)',
                  background: 'var(--surface3)', color: 'var(--text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: (d === -1 ? page === 0 : page === total - 1) ? 'default' : 'pointer',
                  opacity: (d === -1 ? page === 0 : page === total - 1) ? 0.3 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  {d === -1 ? <path d="M8 2L4 6l4 4" /> : <path d="M4 2l4 4-4 4" />}
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {visible.map((p) => (
          <PlaylistCard key={p.id} playlist={p} selected={selected} onClick={() => onSelect(p)} />
        ))}
      </div>

      {total > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 14 }}>
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              style={{
                width: i === page ? 18 : 5, height: 5,
                borderRadius: 3, padding: 0, border: 'none',
                background: i === page ? 'var(--green)' : 'var(--border2)',
                cursor: 'pointer',
                transition: 'width 0.25s ease, background 0.2s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PlaylistGrid;
