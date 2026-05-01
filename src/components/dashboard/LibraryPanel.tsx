import type { CSSProperties, MouseEvent } from 'react';
import type { Playlist } from '../../types';
import PlaylistCard from '../PlaylistCard';

const GLASS: CSSProperties = {
  background: 'var(--glass-bg)',
  border: '1px solid var(--border)',
  borderRadius: 20,
  boxShadow: 'var(--shadow-card)',
};

interface LibraryPanelProps {
  playlists: Playlist[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelect: (playlist: Playlist) => void;
}

function LibraryPanel({ playlists, isLoading, onRefresh, onSelect }: LibraryPanelProps) {
  return (
    <div style={{ ...GLASS, padding: 24, marginBottom: 18, animation: 'fadeUp 0.35s var(--ease-out)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '0 4px' }}>
        <div>
          <p style={{
            fontSize: 10, fontWeight: 700, color: 'var(--green)',
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 5,
          }}>Your Library</p>
          <h2 style={{
            fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px',
            display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6,
          }}>
            Playlists
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', letterSpacing: 0 }}>
              {playlists.length} total
            </span>
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
            Pick a playlist to sort by BPM, energy, popularity, and more
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Refresh playlists"
          style={{
            width: 34, height: 34, borderRadius: '50%',
            border: '1px solid var(--border2)',
            background: 'var(--surface2)',
            color: 'var(--text-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.4 : 1,
            transition: 'border-color 0.2s, color 0.2s, background 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
            if (!isLoading) {
              e.currentTarget.style.borderColor = 'rgba(29,185,84,0.5)';
              e.currentTarget.style.color = 'var(--green)';
              e.currentTarget.style.background = 'rgba(29,185,84,0.08)';
            }
          }}
          onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.borderColor = 'var(--border2)';
            e.currentTarget.style.color = 'var(--text-3)';
            e.currentTarget.style.background = 'var(--surface2)';
          }}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: isLoading ? 'spin 0.7s linear infinite' : 'none' }}
          >
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            <path d="M21 3v5h-5" />
            <path d="M3 21v-5h5" />
          </svg>
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '28px 4px' }}>
          <span style={{
            width: 14, height: 14, borderRadius: '50%',
            border: '2px solid var(--border2)', borderTopColor: 'var(--green)',
            animation: 'spin 0.7s linear infinite',
          }} />
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Loading your library…</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
          gap: 14,
        }}>
          {playlists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} selected={null} onClick={() => onSelect(p)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default LibraryPanel;
