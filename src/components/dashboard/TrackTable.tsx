import type { Track } from '../../types';
import TrackItem from '../TrackItem';

interface TrackTableProps {
  sorted: Track[];
  sortBy: string;
  sortKey: number;
  isLoading: boolean;
  accent: string;
}

function TrackTable({ sorted, sortBy, sortKey, isLoading, accent }: TrackTableProps) {
  return (
    <>
      {/* Column headers */}
      <div
        className="track-row"
        style={{
          padding: '0 24px', height: 38, alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(8, 11, 16, 0.4)',
          position: 'sticky', top: 0, zIndex: 1,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>#</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Title</span>
        <span className="track-artist" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Artist</span>
        <span className="track-pop" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.16em', textTransform: 'uppercase', textAlign: 'right' }}>Pop</span>
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
            <TrackItem key={`${t.id}-${i}`} track={t} index={i} sortBy={sortBy} />
          ))}
        </div>
      )}
    </>
  );
}

export default TrackTable;
