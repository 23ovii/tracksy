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
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 160px 52px 52px',
        gap: 8, padding: '0 24px', height: 38, alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(8, 11, 16, 0.4)',
        position: 'sticky', top: 0, zIndex: 1,
      }}>
        {['#', 'Title', 'Artist', 'Pop', 'Time'].map((h, i) => (
          <span key={h} style={{
            fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
            letterSpacing: '0.16em', textTransform: 'uppercase',
            textAlign: i > 2 ? 'right' : 'left',
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
            <TrackItem key={`${t.id}-${i}`} track={t} index={i} sortBy={sortBy} />
          ))}
        </div>
      )}
    </>
  );
}

export default TrackTable;
