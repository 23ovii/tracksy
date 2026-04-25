import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { useSpotify } from '../hooks/useSpotify.tsx';
import PlaylistCard from '../components/PlaylistCard.tsx';
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
        background: 'linear-gradient(180deg, rgba(7,10,15,0.5) 0%, rgba(7,10,15,0.78) 40%, rgba(7,10,15,0.92) 100%)',
      }} />
    </div>
  );
}

const GLASS: CSSProperties = {
  background: 'rgba(14, 19, 28, 0.88)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 20,
  boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 30px 60px -24px rgba(0,0,0,0.7)',
};

function formatTotalDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

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
  const apiPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/'); return; }
    loadPlaylists();
  }, [isAuthenticated, loadPlaylists, navigate]);

  const sorted = useMemo(() => sortTracks(tracks, sortBy, sortDir), [tracks, sortBy, sortDir]);
  const totalMs = useMemo(() => tracks.reduce((s, t) => s + t.durationMs, 0), [tracks]);

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
    apiPromiseRef.current = applySort(sorted);
  }

  async function handleDone() {
    const playlistName = selectedPlaylist?.name;
    try {
      await apiPromiseRef.current;
      setApplying(false);
      setApplied(true);
      const label = SORT_OPTIONS.find((o) => o.id === sortBy)?.label;
      if (playlistName) setSortFeedback(`"${playlistName}" sorted by ${label} and saved.`);
    } catch {
      setApplying(false);
      setSortFeedback('Failed to save to Spotify. Try again.');
    }
  }

  const accent = selectedPlaylist?.color1 ?? 'var(--green)';
  const accent2 = selectedPlaylist?.color2 ?? '#5af5a0';

  return (
    <>
      <AmbientBackdrop playlist={selectedPlaylist} />

      <div style={{
        maxWidth: 1180, margin: '0 auto', padding: '32px 28px 80px',
        animation: 'fadeUp 0.45s var(--ease-out)',
        position: 'relative', zIndex: 1,
      }}>

        {/* Library card — hidden once a playlist is selected */}
        {!selectedPlaylist && (
          <div style={{ ...GLASS, padding: 24, marginBottom: 18, animation: 'fadeUp 0.35s var(--ease-out)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, padding: '0 4px' }}>
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
                  <PlaylistCard key={p.id} playlist={p} selected={null} onClick={() => handleSelect(p)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sorter */}
        {selectedPlaylist ? (
          <div style={{ ...GLASS, overflow: 'hidden' }}>

            {/* Now Sorting header */}
            <div style={{
              padding: '26px 28px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
              position: 'relative', overflow: 'hidden',
              background: `linear-gradient(135deg, ${accent}14, transparent 55%)`,
            }}>
              {/* Accent line along top */}
              <div aria-hidden style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: `linear-gradient(90deg, transparent, ${accent}aa, ${accent2}aa, transparent)`,
              }} />

              <PlaylistCover playlist={selectedPlaylist} size={96} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: accent,
                    boxShadow: `0 0 12px ${accent}`,
                    animation: 'glow 1.6s ease-in-out infinite',
                  }} />
                  <p style={{
                    fontSize: 10, fontWeight: 700,
                    color: accent,
                    letterSpacing: '0.24em', textTransform: 'uppercase',
                  }}>Now Sorting</p>
                </div>
                <h3 style={{
                  fontSize: 'clamp(22px, 2.6vw, 30px)', fontWeight: 900,
                  letterSpacing: '-0.8px', lineHeight: 1.1,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  marginBottom: 6,
                }}>{selectedPlaylist.name}</h3>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 12.5, color: 'var(--text-3)',
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>
                    {selectedPlaylist.trackCount} tracks
                  </span>
                  {totalMs > 0 && (
                    <>
                      <span>·</span>
                      <span>{formatTotalDuration(totalMs)}</span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                <button
                  onClick={() => { clearSelection(); setApplied(false); setSortFeedback(''); }}
                  style={{
                    padding: '10px 18px', borderRadius: 50,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-2)', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, color 0.2s, background 0.2s',
                  }}
                  onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.color = 'var(--text)';
                  }}
                  onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = 'var(--text-2)';
                  }}
                >← Back</button>
                <button
                  onClick={handleApply}
                  disabled={applying || applied}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 22px', borderRadius: 50,
                    background: applied
                      ? 'linear-gradient(180deg, #22c962, #159743)'
                      : `linear-gradient(135deg, ${accent}, ${accent2})`,
                    border: 'none',
                    color: '#0a0d12',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
                    letterSpacing: '-0.1px',
                    cursor: applying || applied ? 'default' : 'pointer',
                    boxShadow: applied
                      ? '0 8px 24px rgba(29,185,84,0.35)'
                      : `0 10px 28px -4px ${accent}77, 0 0 0 1px rgba(255,255,255,0.12) inset`,
                    transition: 'box-shadow 0.25s, transform 0.2s',
                  }}
                  onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                    if (!applying && !applied) e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.transform = '';
                  }}
                >
                  {applying ? (
                    <>
                      <span style={{ display: 'inline-block', animation: 'spin 0.7s linear infinite' }}>↻</span>
                      Applying…
                    </>
                  ) : applied ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Saved to Spotify
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5" /><path d="M5 12l7-7 7 7" />
                      </svg>
                      Apply to Spotify
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Horizontal sort chips */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', gap: 8, flexWrap: 'wrap',
              background: 'rgba(8, 11, 16, 0.4)',
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
                letterSpacing: '0.18em', textTransform: 'uppercase',
                alignSelf: 'center', marginRight: 6,
              }}>Sort by</span>
              {SORT_OPTIONS.map((opt) => {
                const active = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => pickSort(opt.id)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '8px 14px', borderRadius: 50,
                      background: active ? `${opt.color}20` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? opt.color + '66' : 'rgba(255,255,255,0.07)'}`,
                      fontFamily: 'inherit', cursor: 'pointer',
                      color: active ? opt.color : 'var(--text-2)',
                      fontSize: 12.5, fontWeight: active ? 700 : 500,
                      transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                      boxShadow: active ? `0 0 0 3px ${opt.color}12` : 'none',
                    }}
                    onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.color = 'var(--text)';
                      }
                    }}
                    onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        e.currentTarget.style.color = 'var(--text-2)';
                      }
                    }}
                  >
                    {opt.label}
                    {active && (
                      <span style={{ fontSize: 12, fontWeight: 800, marginLeft: 2 }}>
                        {sortDir === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <SortProgress
              active={applying}
              label={SORT_OPTIONS.find((o) => o.id === sortBy)?.label}
              onDone={handleDone}
              color={accent}
              colorEnd={accent2}
            />

            {sortFeedback && !applying && (
              <div style={{
                padding: '12px 24px',
                background: `${accent}10`,
                borderBottom: `1px solid ${accent}22`,
                fontSize: 13, color: accent, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 8,
                animation: 'fadeIn 0.3s var(--ease-out)',
              }}>
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {sortFeedback}
              </div>
            )}

            {/* Column headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 160px 56px 64px 52px 52px',
              gap: 8, padding: '0 24px', height: 38, alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(8, 11, 16, 0.4)',
              position: 'sticky', top: 0, zIndex: 1,
            }}>
              {['#', 'Title', 'Artist', 'BPM', 'Energy', 'Pop', 'Time'].map((h, i) => (
                <span key={h} style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  textAlign: i > 4 ? 'right' : 'left',
                }}>{h}</span>
              ))}
            </div>

            {isLoading ? (
              <div style={{
                padding: '40px 24px', fontSize: 13, color: 'var(--text-3)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid var(--border2)', borderTopColor: accent,
                  animation: 'spin 0.7s linear infinite',
                }} />
                Loading tracks…
              </div>
            ) : (
              <div key={sortKey} style={{ maxHeight: 480, overflowY: 'auto' }}>
                {sorted.map((t, i) => (
                  <TrackItem key={t.id ?? i} track={t} index={i} sortBy={sortBy} />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}

export default Dashboard;
