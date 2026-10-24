import type { Playlist } from '../../types';
import { GLASS_SURFACE } from '../../styles/tokens.ts';
import PlaylistCard from '../PlaylistCard';

interface LibraryPanelProps {
  playlists: Playlist[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRefresh: () => void;
  onSelect: (playlist: Playlist) => void;
}

function LibraryPanel({ playlists, isLoading, isFetching, isError, onRefresh, onSelect }: LibraryPanelProps) {
  return (
    <div style={{ ...GLASS_SURFACE, padding: 24, marginBottom: 18, animation: 'fadeUp 0.35s var(--ease-out)' }}>
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
            Pick a playlist to sort by title, artist, popularity, date added, duration, or discography
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isFetching}
          aria-label="Refresh playlists"
          className="tk-icon-btn"
          style={{
            width: 34, height: 34, borderRadius: '50%',
            border: '1px solid var(--border2)',
            background: 'var(--surface2)',
            color: 'var(--text-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: isFetching ? 'not-allowed' : 'pointer',
            opacity: isFetching ? 0.4 : 1,
            flexShrink: 0,
          }}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: isFetching ? 'spin 0.7s linear infinite' : 'none' }}
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
        <>
          {isError && (
            <div role="alert" style={{
              marginBottom: playlists.length > 0 ? 16 : 0,
              padding: '14px 16px',
              border: '1px solid rgba(239,68,68,0.22)',
              borderRadius: 10,
              background: 'rgba(239,68,68,0.08)',
              color: 'var(--error-text)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <span>
                {playlists.length > 0
                  ? 'Could not refresh your playlists. Showing the last loaded library.'
                  : 'Could not load your playlists. Check your connection and try again.'}
              </span>
              {playlists.length === 0 && (
                <button
                  onClick={onRefresh}
                  disabled={isFetching}
                  style={{
                    flexShrink: 0,
                    border: '1px solid currentColor',
                    borderRadius: 6,
                    padding: '6px 10px',
                    background: 'transparent',
                    color: 'inherit',
                    font: 'inherit',
                    fontWeight: 700,
                    cursor: isFetching ? 'not-allowed' : 'pointer',
                  }}
                >
                  Try again
                </button>
              )}
            </div>
          )}
          {!isError && playlists.length === 0 && (
            <p role="status" style={{ padding: '18px 4px', color: 'var(--text-3)', fontSize: 13 }}>
              No playlists found in your library.
            </p>
          )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
          gap: 14,
        }}>
          {playlists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} selected={null} onClick={() => onSelect(p)} />
          ))}
        </div>
        </>
      )}
    </div>
  );
}

export default LibraryPanel;
