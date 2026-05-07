import type { CSSProperties } from 'react';

export interface FilterState {
  query: string;
  yearMin: string;
  yearMax: string;
  popMin: string;
  popMax: string;
  durMin: string;
  durMax: string;
}

export const DEFAULT_FILTER: FilterState = {
  query: '', yearMin: '', yearMax: '', popMin: '', popMax: '', durMin: '', durMax: '',
};

export function countActiveFilters(f: FilterState): number {
  let n = 0;
  if (f.query.trim()) n++;
  if (f.yearMin || f.yearMax) n++;
  if (f.popMin || f.popMax) n++;
  if (f.durMin || f.durMax) n++;
  return n;
}

interface FilterBarProps {
  open: boolean;
  onToggle: () => void;
  filter: FilterState;
  onChange: (f: FilterState) => void;
  activeCount: number;
}

const LABEL: CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
  letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4,
};

const RANGE_ROW: CSSProperties = { display: 'flex', alignItems: 'center', gap: 4 };

const SEP: CSSProperties = { fontSize: 11, color: 'var(--text-3)' };

function numInput(overrides?: CSSProperties): CSSProperties {
  return {
    background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: 6, padding: '5px 8px',
    fontSize: 12, color: 'var(--text)', fontFamily: 'inherit',
    width: 68, outline: 'none',
    ...overrides,
  };
}

function FilterBar({ open, onToggle, filter, onChange, activeCount }: FilterBarProps) {
  function set(key: keyof FilterState, value: string) {
    onChange({ ...filter, [key]: value });
  }

  function clearAll() {
    onChange(DEFAULT_FILTER);
  }

  const isActive = activeCount > 0;

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Toggle row */}
      <div style={{
        padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-inset)',
      }}>
        <button
          onClick={onToggle}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 50,
            background: open || isActive ? 'var(--chip-bg-active)' : 'var(--chip-bg-inactive)',
            border: `1px solid ${open || isActive ? 'var(--chip-border-active)' : 'var(--border2)'}`,
            color: open || isActive ? 'var(--green)' : 'var(--text-2)',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M4 8h8M7 12h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Filters
          {isActive && (
            <span style={{
              background: 'var(--green)', color: '#0a0d12',
              borderRadius: 10, padding: '0 5px',
              fontSize: 10, fontWeight: 800, lineHeight: '16px',
              minWidth: 16, textAlign: 'center', display: 'inline-block',
            }}>
              {activeCount}
            </span>
          )}
        </button>
        {isActive && !open && (
          <button
            onClick={clearAll}
            style={{
              background: 'none', border: 'none', color: 'var(--text-3)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              textDecoration: 'underline', textUnderlineOffset: 3, padding: 0,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Expanded panel */}
      {open && (
        <div style={{
          padding: '12px 24px 16px',
          background: 'var(--bg-inset)',
          display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end',
          animation: 'fadeIn 0.15s var(--ease-out)',
        }}>
          {/* Search */}
          <div>
            <label style={LABEL}>Search</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 7, color: 'var(--text-3)', pointerEvents: 'none', flexShrink: 0 }}>
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
                <line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={filter.query}
                onChange={(e) => set('query', e.target.value)}
                placeholder="Title or artist…"
                style={numInput({ width: 160, paddingLeft: 24 })}
              />
            </div>
          </div>

          {/* Year range */}
          <div>
            <label style={LABEL}>Year</label>
            <div style={RANGE_ROW}>
              <input
                type="number"
                value={filter.yearMin}
                onChange={(e) => set('yearMin', e.target.value)}
                placeholder="1970"
                min="1900" max="2100" step="1"
                style={numInput()}
              />
              <span style={SEP}>–</span>
              <input
                type="number"
                value={filter.yearMax}
                onChange={(e) => set('yearMax', e.target.value)}
                placeholder="2025"
                min="1900" max="2100" step="1"
                style={numInput()}
              />
            </div>
          </div>

          {/* Popularity range */}
          <div>
            <label style={LABEL}>Popularity (0–100)</label>
            <div style={RANGE_ROW}>
              <input
                type="number"
                value={filter.popMin}
                onChange={(e) => set('popMin', e.target.value)}
                placeholder="0"
                min="0" max="100" step="1"
                style={numInput()}
              />
              <span style={SEP}>–</span>
              <input
                type="number"
                value={filter.popMax}
                onChange={(e) => set('popMax', e.target.value)}
                placeholder="100"
                min="0" max="100" step="1"
                style={numInput()}
              />
            </div>
          </div>

          {/* Duration range */}
          <div>
            <label style={LABEL}>Duration (min)</label>
            <div style={RANGE_ROW}>
              <input
                type="number"
                value={filter.durMin}
                onChange={(e) => set('durMin', e.target.value)}
                placeholder="0"
                min="0" step="0.5"
                style={numInput()}
              />
              <span style={SEP}>–</span>
              <input
                type="number"
                value={filter.durMax}
                onChange={(e) => set('durMax', e.target.value)}
                placeholder="∞"
                min="0" step="0.5"
                style={numInput()}
              />
            </div>
          </div>

          {isActive && (
            <div style={{ alignSelf: 'flex-end', paddingBottom: 2 }}>
              <button
                onClick={clearAll}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-3)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  textDecoration: 'underline', textUnderlineOffset: 3, padding: 0,
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FilterBar;
