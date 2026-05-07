import type { Track } from '../../types';
import TrackItem from '../TrackItem';

interface TrackTableProps {
  sorted: Track[];
  sortBy: string;
  sortKey: number;
  isLoading: boolean;
  accent: string;
  diffMap?: Map<Track, number>;
  showPreview: boolean;
  onTogglePreview: () => void;
}

function TrackTable({
  sorted, sortBy, sortKey, isLoading, accent, diffMap, showPreview, onTogglePreview,
}: TrackTableProps) {
  const hasDiff = diffMap && diffMap.size > 0;

  let nUp = 0, nDown = 0, nUnchanged = 0;
  if (hasDiff) {
    for (const delta of diffMap.values()) {
      if (delta > 0) nUp++;
      else if (delta < 0) nDown++;
      else nUnchanged++;
    }
  }

  const withDelta = showPreview && hasDiff;

  return (
    <>
      {hasDiff && (
        <div style={{
          padding: '8px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--bg-inset)',
        }}>
          <span style={{
            flex: 1,
            fontSize: 11, color: 'var(--text-3)',
            fontFamily: 'monospace', letterSpacing: '-0.01em',
          }}>
            <span style={{ color: '#4ade80' }}>↑ {nUp}</span>
            <span style={{ color: 'var(--text-3)' }}> moved up · </span>
            <span style={{ color: '#f87171' }}>↓ {nDown}</span>
            <span style={{ color: 'var(--text-3)' }}> moved down · </span>
            <span>— {nUnchanged} unchanged</span>
          </span>
          <button
            onClick={onTogglePreview}
            style={{
              background: 'none', border: '1px solid var(--border2)',
              borderRadius: 5, padding: '3px 9px',
              fontSize: 11, color: 'var(--text-3)', cursor: 'pointer',
              whiteSpace: 'nowrap', letterSpacing: '-0.01em',
            }}
          >
            {showPreview ? 'Hide preview' : 'Show preview'}
          </button>
        </div>
      )}

      {/* Column headers */}
      <div
        className={withDelta ? 'track-row track-row--delta' : 'track-row'}
        style={{
          padding: '0 24px', height: 38, alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-inset)',
          position: 'sticky', top: 0, zIndex: 1,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>#</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Title</span>
        <span className="track-artist" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Artist</span>
        <span className="track-pop" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.16em', textTransform: 'uppercase', textAlign: 'right' }}>Pop</span>
        {withDelta && (
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.16em', textTransform: 'uppercase', textAlign: 'center' }}>Δ</span>
        )}
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.16em', textTransform: 'uppercase', textAlign: 'right' }}>Time</span>
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
            <TrackItem
              key={`${t.id}-${i}`}
              track={t}
              index={i}
              sortBy={sortBy}
              delta={withDelta ? diffMap!.get(t) : undefined}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default TrackTable;
