import type { MouseEvent } from 'react';
import { SORT_OPTIONS } from '../../utils/playlistUtils';
import { useShortcutsOverlay } from '../../context/ShortcutsOverlayContext';

interface SortChipsProps {
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onPick: (id: string) => void;
}

function SortChips({ sortBy, sortDir, onPick }: SortChipsProps) {
  const { toggle: toggleShortcuts } = useShortcutsOverlay();
  return (
    <div style={{
      padding: '16px 24px',
      borderBottom: '1px solid var(--border)',
      display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
      background: 'var(--bg-inset)',
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
            onClick={() => onPick(opt.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 14px', borderRadius: 50,
              background: active ? `${opt.color}20` : 'var(--chip-bg-inactive)',
              border: `1px solid ${active ? opt.color + '66' : 'var(--border)'}`,
              fontFamily: 'inherit', cursor: 'pointer',
              color: active ? opt.color : 'var(--text-2)',
              fontSize: 12.5, fontWeight: active ? 700 : 500,
              transition: 'background 0.15s, border-color 0.15s, color 0.15s',
              boxShadow: active ? `0 0 0 3px ${opt.color}12` : 'none',
            }}
            onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
              if (!active) {
                e.currentTarget.style.background = 'var(--chip-bg-hover)';
                e.currentTarget.style.color = 'var(--text)';
              }
            }}
            onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
              if (!active) {
                e.currentTarget.style.background = 'var(--chip-bg-inactive)';
                e.currentTarget.style.color = 'var(--text-2)';
              }
            }}
          >
            {opt.label}
            {active && opt.id !== 'discography' && (
              <span style={{ fontSize: 12, fontWeight: 800, marginLeft: 2 }}>
                {sortDir === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        );
      })}

      <button
        onClick={toggleShortcuts}
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts (?)"
        style={{
          marginLeft: 'auto', width: 26, height: 26, borderRadius: 6,
          border: '1px solid var(--border)', background: 'transparent',
          color: 'var(--text-3)', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'border-color 0.15s, color 0.15s, background 0.15s',
        }}
        onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.borderColor = 'var(--border2)';
          e.currentTarget.style.color = 'var(--text-2)';
          e.currentTarget.style.background = 'var(--chip-bg-hover)';
        }}
        onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text-3)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        ?
      </button>
    </div>
  );
}

export default SortChips;
