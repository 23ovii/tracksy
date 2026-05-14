import { useRef } from 'react';
import type { RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

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
  showFilter?: boolean;
  filterQuery?: string;
  filterInputRef?: RefObject<HTMLInputElement | null>;
  onFilterChange?: (q: string) => void;
  onFilterClose?: () => void;
}

function VirtualTrackList({ sorted, sortBy, diffMap, withDelta }: {
  sorted: Track[];
  sortBy: string;
  diffMap: Map<Track, number> | undefined;
  withDelta: boolean;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 58,
    overscan: 8,
  });

  const items = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div
      ref={parentRef}
      style={{ maxHeight: 480, overflowY: 'auto' }}
    >
      <div style={{ height: totalSize, position: 'relative' }}>
        {items.map((virtualItem) => {
          const t = sorted[virtualItem.index];
          if (!t) return null;
          const delta = withDelta ? diffMap!.get(t) : undefined;
          return (
            <div
              key={`${t.id}-${virtualItem.index}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <TrackItem
                track={t}
                index={virtualItem.index}
                sortBy={sortBy}
                {...(delta !== undefined ? { delta } : {})}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrackTable({
  sorted, sortBy, sortKey, isLoading, accent, diffMap, showPreview, onTogglePreview,
  showFilter, filterQuery, filterInputRef, onFilterChange, onFilterClose,
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

      {showFilter && (
        <div style={{
          padding: '8px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-inset)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeIn 0.15s var(--ease-out)',
        }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: 'var(--text-3)' }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
            <line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            ref={filterInputRef}
            type="text"
            value={filterQuery ?? ''}
            onChange={(e) => onFilterChange?.(e.target.value)}
            onKeyDown={undefined}
            placeholder="Filter by title or artist…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 13, color: 'var(--text)', fontFamily: 'inherit',
            }}
          />
          {filterQuery && (
            <button
              onClick={() => onFilterChange?.('')}
              aria-label="Clear filter"
              style={{
                background: 'none', border: 'none', color: 'var(--text-3)',
                fontSize: 16, lineHeight: 1, cursor: 'pointer', padding: 2, borderRadius: 3,
              }}
            >×</button>
          )}
          <button
            onClick={onFilterClose}
            aria-label="Close filter"
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 4, padding: '2px 8px',
              fontSize: 11, color: 'var(--text-3)', cursor: 'pointer',
            }}
          >
            Esc
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
        <div key={sortKey}>
          <VirtualTrackList
            sorted={sorted}
            sortBy={sortBy}
            diffMap={diffMap ?? undefined}
            withDelta={!!withDelta}
          />
        </div>
      )}
    </>
  );
}

export default TrackTable;
