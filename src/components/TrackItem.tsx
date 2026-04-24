import type { MouseEvent } from 'react';
import MiniWave from './MiniWave.tsx';
import { SORT_OPTIONS } from '../utils/playlistUtils.ts';
import type { Track } from '../types';

interface TrackItemProps {
  track: Track;
  index: number;
  sortBy: string;
  sortKey?: number;
}

function formatDuration(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TrackItem({ track, index, sortBy }: TrackItemProps) {
  const opt = SORT_OPTIONS.find((o) => o.id === sortBy);
  const activeColor = opt?.color ?? 'var(--text-2)';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 160px 56px 64px 52px 52px',
        gap: 8,
        padding: '0 24px',
        height: 58,
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        transition: 'background 0.18s, box-shadow 0.18s',
        animation: index < 20 ? `trackIn 0.24s var(--ease-out) ${index * 0.02}s both` : 'none',
        cursor: 'default',
        position: 'relative',
      }}
      onMouseEnter={(e: MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.background = 'linear-gradient(90deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))';
        e.currentTarget.style.boxShadow = `inset 3px 0 0 ${activeColor}`;
      }}
      onMouseLeave={(e: MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.boxShadow = 'none';
      }}
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
      </div>

      <div style={{
        fontSize: 13,
        fontWeight: sortBy === 'artist' ? 700 : 400,
        color: sortBy === 'artist' ? opt?.color : 'var(--text-2)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{track.artist}</div>

      <div style={{
        fontSize: 13,
        fontWeight: sortBy === 'bpm' ? 700 : 500,
        color: sortBy === 'bpm' ? opt?.color : track.bpm ? 'var(--text-2)' : 'var(--text-3)',
        fontVariantNumeric: 'tabular-nums',
      }}>{track.bpm || '—'}</div>

      <MiniWave
        value={track.energy}
        color={sortBy === 'energy' ? opt?.color : 'var(--border2)'}
      />

      <div style={{
        textAlign: 'right', fontSize: 13,
        fontWeight: sortBy === 'popularity' ? 700 : 500,
        color: sortBy === 'popularity' ? opt?.color : 'var(--text-2)',
        fontVariantNumeric: 'tabular-nums',
      }}>{track.popularity}</div>

      <div style={{
        textAlign: 'right', fontSize: 12,
        fontWeight: sortBy === 'durationMs' ? 700 : 500,
        color: sortBy === 'durationMs' ? opt?.color : 'var(--text-3)',
        fontVariantNumeric: 'tabular-nums',
      }}>{formatDuration(track.durationMs)}</div>
    </div>
  );
}

export default TrackItem;
