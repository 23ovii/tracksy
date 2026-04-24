import { useEffect, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { useSpotify } from '../hooks/useSpotify.tsx';
import PlaylistSlider from '../components/PlaylistSlider.tsx';
import TrackItem from '../components/TrackItem.tsx';
import SortProgress from '../components/SortProgress.tsx';
import { SORT_OPTIONS, sortTracks } from '../utils/playlistUtils.ts';
import type { Playlist } from '../types';

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
      boxShadow: `0 4px 20px ${playlist.color1}44`,
      overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
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
    </div>
  );
}

const CARD_STYLE: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
};

function Dashboard() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { playlists, tracks, selectedPlaylist, isLoading, loadPlaylists, loadPlaylistTracks, applySort, clearSelection } = useSpotify();

  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [sortFeedback, setSortFeedback] = useState('');
  const [sortKey, setSortKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/'); return; }
    loadPlaylists();
  }, [isAuthenticated, loadPlaylists, navigate]);

  const sorted = sortTracks(tracks, sortBy, sortDir);

  function pickSort(id: string) {
    if (sortBy === id) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(id); setSortDir('asc'); }
    setApplied(false);
    setSortFeedback('');
    setSortKey((k) => k + 1);
  }

  function handleSelect(playlist: Playlist) {
    loadPlaylistTracks(playlist);
    setApplied(false);
    setSortFeedback('');
    setSortKey((k) => k + 1);
  }

  function handleApply() {
    setApplying(true);
    setSortFeedback('');
    applySort(sorted).catch(console.error);
  }

  function handleDone() {
    setApplying(false);
    setApplied(true);
    const label = SORT_OPTIONS.find((o) => o.id === sortBy)?.label;
    setSortFeedback(`"${selectedPlaylist!.name}" sorted by ${label} and saved.`);
  }

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '28px 28px 60px', animation: 'fadeUp 0.35s ease' }}>

      {/* Playlist picker */}
      <div style={{ ...CARD_STYLE, padding: 24, marginBottom: 16 }}>
        {isLoading && !selectedPlaylist ? (
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Loading playlists…</p>
        ) : (
          <PlaylistSlider playlists={playlists} selected={selectedPlaylist} onSelect={handleSelect} />
        )}
      </div>

      {/* Sorter panel */}
      {selectedPlaylist ? (
        <div style={{ ...CARD_STYLE, overflow: 'hidden' }}>

          {/* Header */}
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            background: 'var(--surface2)',
          }}>
            <PlaylistCover playlist={selectedPlaylist} size={46} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 3 }}>
                Sorting
              </p>
              <h3 style={{
                fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{selectedPlaylist.name}</h3>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <button
                onClick={() => { clearSelection(); setApplied(false); setSortFeedback(''); }}
                style={{
                  padding: '8px 16px', borderRadius: 50,
                  background: 'var(--surface3)', border: '1px solid var(--border2)',
                  color: 'var(--text-2)', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer',
                }}
              >Clear</button>
              <button
                onClick={handleApply}
                disabled={applying || applied}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 20px', borderRadius: 50,
                  background: applied ? '#168a40' : 'var(--green)',
                  border: 'none',
                  color: applied ? 'white' : '#000',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                  cursor: applying || applied ? 'default' : 'pointer',
                  boxShadow: applied ? 'none' : '0 2px 16px rgba(29,185,84,0.3)',
                  transition: 'background 0.3s',
                }}
              >
                {applying
                  ? <><span style={{ display: 'inline-block', animation: 'spin 0.7s linear infinite' }}>↻</span> Applying…</>
                  : applied ? '✓ Saved to Spotify' : '↑ Apply to Spotify'
                }
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <SortProgress
            active={applying}
            label={SORT_OPTIONS.find((o) => o.id === sortBy)?.label}
            onDone={handleDone}
          />

          {/* Feedback */}
          {sortFeedback && !applying && (
            <div style={{
              padding: '12px 24px',
              background: 'rgba(29,185,84,0.06)',
              borderBottom: '1px solid rgba(29,185,84,0.15)',
              fontSize: 13, color: 'var(--green)', fontWeight: 500,
            }}>✓ {sortFeedback}</div>
          )}

          <div style={{ display: 'flex' }}>
            {/* Sort sidebar */}
            <div style={{
              width: 196, flexShrink: 0,
              borderRight: '1px solid var(--border)',
              padding: '16px 10px',
              display: 'flex', flexDirection: 'column', gap: 3,
              background: 'var(--surface)',
            }}>
              <p style={{
                fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
                letterSpacing: '0.15em', textTransform: 'uppercase',
                marginBottom: 6, paddingLeft: 8,
              }}>Sort by</p>
              {SORT_OPTIONS.map((opt) => {
                const active = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => pickSort(opt.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 10px', borderRadius: 10,
                      background: active ? `${opt.color}18` : 'transparent',
                      border: `1px solid ${active ? opt.color + '44' : 'transparent'}`,
                      fontFamily: 'inherit', cursor: 'pointer',
                      transition: 'background 0.12s, border-color 0.12s',
                      color: 'var(--text)',
                    }}
                    onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? opt.color : 'var(--text-2)', textAlign: 'left' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'left', marginTop: 1 }}>
                        {opt.sub}
                      </div>
                    </div>
                    {active && (
                      <span style={{ fontSize: 13, color: opt.color, fontWeight: 700 }}>
                        {sortDir === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Track list */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {/* Column headers */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 160px 56px 64px 52px 44px',
                gap: 8, padding: '0 24px', height: 36, alignItems: 'center',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface2)',
                position: 'sticky', top: 0, zIndex: 1,
              }}>
                {['#', 'Title', 'Artist', 'BPM', 'Energy', 'Pop', '⏱'].map((h, i) => (
                  <span key={h} style={{
                    fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    textAlign: i > 4 ? 'right' : 'left',
                  }}>{h}</span>
                ))}
              </div>
              {isLoading ? (
                <div style={{ padding: '24px', fontSize: 13, color: 'var(--text-3)' }}>Loading tracks…</div>
              ) : (
                <div key={sortKey} style={{ maxHeight: 420, overflowY: 'auto' }}>
                  {sorted.map((t, i) => (
                    <TrackItem key={t.id} track={t} index={i} sortBy={sortBy} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div style={{
          ...CARD_STYLE,
          padding: '56px 32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--surface3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="15" y2="12" />
              <line x1="3" y1="18" x2="9" y2="18" />
            </svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Select a playlist to sort</p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 320 }}>
            Pick one from your library above, then choose a sort order to reorder its tracks.
          </p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
