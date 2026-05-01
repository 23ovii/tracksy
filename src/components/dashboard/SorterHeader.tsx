import { useState, useEffect } from 'react';
import type { MouseEvent } from 'react';
import type { Playlist } from '../../types';
import type { HistoryEntry } from '../../services/sortHistory';
import PlaylistCover from './PlaylistCover';

interface SorterHeaderProps {
  selectedPlaylist: Playlist;
  totalMs: number;
  applying: boolean;
  applied: boolean;
  accent: string;
  accent2: string;
  historyEntries: HistoryEntry[];
  onBack: () => void;
  onApply: () => void;
  onRestore: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
}

function formatTotalDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function SorterHeader({
  selectedPlaylist, totalMs, applying, applied, accent, accent2,
  historyEntries, onBack, onApply, onRestore, onClearHistory,
}: SorterHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (applying) setDrawerOpen(false);
  }, [applying]);

  const reversed = [...historyEntries].reverse();

  return (
    <>
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
          {historyEntries.length > 0 && !applying && (
            <button
              onClick={() => setDrawerOpen(true)}
              style={{
                padding: '10px 16px', borderRadius: 50,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-2)',
                fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.color = 'var(--text)';
              }}
              onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = 'var(--text-2)';
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" />
              </svg>
              History
              <span style={{
                background: `${accent}22`,
                color: accent,
                borderRadius: 10,
                padding: '1px 6px',
                fontSize: 10,
                fontWeight: 700,
              }}>{historyEntries.length}</span>
            </button>
          )}
          <button
            onClick={onBack}
            style={{
              padding: '10px 18px', borderRadius: 50,
              background: applying ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${applying ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
              color: applying ? '#f87171' : 'var(--text-2)',
              fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500,
              cursor: 'pointer',
              transition: 'border-color 0.2s, color 0.2s, background 0.2s',
            }}
            onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.borderColor = applying ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.2)';
              e.currentTarget.style.color = applying ? '#fca5a5' : 'var(--text)';
            }}
            onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.borderColor = applying ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = applying ? '#f87171' : 'var(--text-2)';
            }}
          >{applying ? '✕ Cancel' : '← Back'}</button>
          <button
            onClick={onApply}
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
              cursor: applying || applied ? 'not-allowed' : 'pointer',
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

      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.45)',
              animation: 'fadeIn 0.2s ease',
            }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: 340, zIndex: 201,
            background: 'rgba(10, 13, 20, 0.98)',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.25s var(--ease-out)',
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 20px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, marginBottom: 3 }}>
                  Sort History
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>
                  {selectedPlaylist.name}
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close history"
                style={{
                  width: 28, height: 28,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  color: 'var(--text-3)', fontSize: 16, lineHeight: 1,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
            </div>

            {/* Entries */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
              {reversed.map((entry, i) => (
                <div
                  key={entry.id}
                  style={{
                    padding: '14px 20px',
                    borderBottom: i < reversed.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: `${accent}18`,
                    border: `1px solid ${accent}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M7 12h10M11 18h2" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                      {entry.sortLabel}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {relativeTime(entry.appliedAt)} · {entry.trackIdsAfter.length} tracks
                    </div>
                  </div>
                  <button
                    onClick={() => { onRestore(entry); setDrawerOpen(false); }}
                    style={{
                      padding: '6px 12px', borderRadius: 6, flexShrink: 0,
                      background: `${accent}12`,
                      border: `1px solid ${accent}30`,
                      color: accent,
                      fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.background = `${accent}22`;
                      e.currentTarget.style.borderColor = `${accent}55`;
                    }}
                    onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.background = `${accent}12`;
                      e.currentTarget.style.borderColor = `${accent}30`;
                    }}
                  >Restore</button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'center',
            }}>
              <button
                onClick={() => { onClearHistory(); setDrawerOpen(false); }}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text-3)', fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >Clear history</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default SorterHeader;
