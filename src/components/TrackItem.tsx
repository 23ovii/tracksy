import { memo } from 'react';
import type { CSSProperties } from 'react';

import { SORT_OPTIONS } from '../utils/playlistUtils.ts';
import { formatDuration } from '../utils/format.ts';
import type { Track } from '../types';

interface TrackItemProps {
  track: Track;
  index: number;
  sortBy: string;
  delta?: number;
}

const TrackItem = memo(function TrackItem({ track, index, sortBy, delta }: TrackItemProps) {
  const opt = SORT_OPTIONS.find((o) => o.id === sortBy);
  const activeColor = opt?.color ?? 'var(--text-2)';

  return (
    <div
      className={`tk-row-hoverable${delta !== undefined ? ' track-row track-row--delta' : ' track-row'}`}
      style={{
        '--row-accent': activeColor,
        padding: '0 24px',
        height: 58,
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        animation: index < 20 ? `trackIn 0.24s var(--ease-out) ${index * 0.02}s both` : 'none',
        cursor: 'default',
        position: 'relative',
      } as CSSProperties}
    >
      <span style={{
        color: 'var(--text-3)', fontSize: 12, fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {String(index + 1).padStart(2, '0')}
      </span>

      <div style={{ minWidth: 0 }}>
        <div style={{
          fontWeight: 600, fontSize: 14,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          color: 'var(--text)',
          letterSpacing: '-0.1px',
        }}>{track.name}</div>
        <div style={{
          fontSize: 11, color: 'var(--text-3)', marginTop: 2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{track.album}</div>
        <div className="track-artist-subline" style={{
          fontSize: 11, color: 'var(--text-3)', marginTop: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{track.artist}</div>
      </div>

      <div className="track-artist" style={{
        fontSize: 13,
        fontWeight: sortBy === 'artist' ? 700 : 400,
        color: sortBy === 'artist' ? opt?.color : 'var(--text-2)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{track.artist}</div>

      <div className="track-pop" style={{
        textAlign: 'right', fontSize: 13,
        fontWeight: sortBy === 'popularity' ? 700 : 500,
        color: sortBy === 'popularity' ? opt?.color : 'var(--text-2)',
        fontVariantNumeric: 'tabular-nums',
      }}>{track.popularity}</div>

      {delta !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {delta > 0 ? (
            <span style={{
              color: '#4ade80', background: 'rgba(74,222,128,0.12)',
              padding: '2px 5px', borderRadius: 4,
              fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              fontFamily: 'monospace', display: 'inline-block', minWidth: 32, textAlign: 'center',
            }}>↑{delta}</span>
          ) : delta < 0 ? (
            <span style={{
              color: '#f87171', background: 'rgba(248,113,113,0.12)',
              padding: '2px 5px', borderRadius: 4,
              fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              fontFamily: 'monospace', display: 'inline-block', minWidth: 32, textAlign: 'center',
            }}>↓{Math.abs(delta)}</span>
          ) : (
            <span style={{
              color: 'var(--text-3)', fontSize: 11, fontFamily: 'monospace',
              display: 'inline-block', minWidth: 32, textAlign: 'center',
              padding: '2px 5px',
            }}>—</span>
          )}
        </div>
      )}

      <div style={{
        textAlign: 'right', fontSize: 12,
        fontWeight: sortBy === 'durationMs' ? 700 : 500,
        color: sortBy === 'durationMs' ? opt?.color : 'var(--text-3)',
        fontVariantNumeric: 'tabular-nums',
      }}>{formatDuration(track.durationMs)}</div>
    </div>
  );
}, (prev, next) =>
  prev.track.id === next.track.id &&
  prev.index === next.index &&
  prev.sortBy === next.sortBy &&
  prev.delta === next.delta
);

export default TrackItem;
