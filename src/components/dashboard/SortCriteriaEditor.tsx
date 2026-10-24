import type { CSSProperties } from 'react';

import { SORT_OPTIONS } from '../../utils/playlistUtils';
import type { SortCriterion, SortKey } from '../../utils/playlistUtils';
import { useShortcutsOverlay } from '../../context/ShortcutsOverlayContext';

interface SortCriteriaEditorProps {
  criteria: SortCriterion[];
  onChange: (criteria: SortCriterion[]) => void;
  disabled?: boolean;
}

function SortCriteriaEditor({ criteria, onChange, disabled = false }: SortCriteriaEditorProps) {
  const { toggle: toggleShortcuts } = useShortcutsOverlay();
  const usedKeys = new Set(criteria.map(({ key }) => key));

  function changeKey(index: number, key: SortKey) {
    if (criteria.some((criterion, i) => i !== index && criterion.key === key)) return;
    onChange(criteria.map((criterion, i) => i === index
      ? { key, direction: 'asc' }
      : criterion));
  }

  function changeDirection(index: number) {
    onChange(criteria.map((criterion, i) => i === index
      ? { ...criterion, direction: criterion.direction === 'asc' ? 'desc' : 'asc' }
      : criterion));
  }

  function move(index: number, offset: -1 | 1) {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= criteria.length) return;
    const next = [...criteria];
    const [criterion] = next.splice(index, 1);
    if (!criterion) return;
    next.splice(nextIndex, 0, criterion);
    onChange(next);
  }

  function remove(index: number) {
    if (criteria.length <= 1) return;
    onChange(criteria.filter((_, i) => i !== index));
  }

  function add() {
    const option = SORT_OPTIONS.find(({ id }) => !usedKeys.has(id));
    if (option) onChange([...criteria, { key: option.id, direction: 'asc' }]);
  }

  return (
    <div style={{
      padding: '16px 24px',
      borderBottom: '1px solid var(--border)',
      display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
      background: 'var(--bg-inset)',
    }}>
      <span style={{
        fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
        letterSpacing: '0.18em', textTransform: 'uppercase',
        alignSelf: 'center', marginRight: 6,
      }}>Sort by</span>

      <div role="list" aria-label="Sort criteria" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {criteria.map((criterion, index) => {
          const option = SORT_OPTIONS.find(({ id }) => id === criterion.key);
          if (!option) return null;
          const direction = criterion.direction === 'asc' ? 'ascending' : 'descending';
          const nextDirection = criterion.direction === 'asc' ? 'descending' : 'ascending';

          return (
            <div
              key={criterion.key}
              role="listitem"
              aria-label={`Sort level ${index + 1}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <span aria-hidden="true" style={{ fontSize: 11, color: 'var(--text-3)' }}>{index + 1}.</span>
              <select
                value={criterion.key}
                aria-label={`Sort field ${index + 1}`}
                disabled={disabled}
                onChange={(event) => {
                  const selected = SORT_OPTIONS.find(({ id }) => id === event.currentTarget.value);
                  if (selected) changeKey(index, selected.id);
                }}
                style={{
                  minHeight: 34, padding: '6px 10px', borderRadius: 50,
                  background: 'var(--chip-bg-inactive)',
                  border: `1px solid ${option.color}66`,
                  color: option.color, fontFamily: 'inherit', fontSize: 12,
                  fontWeight: 600, cursor: disabled ? 'default' : 'pointer',
                }}
              >
                {SORT_OPTIONS.map((sortOption) => (
                  <option
                    key={sortOption.id}
                    value={sortOption.id}
                    disabled={usedKeys.has(sortOption.id) && sortOption.id !== criterion.key}
                  >
                    {sortOption.label}
                  </option>
                ))}
              </select>

              {criterion.key === 'discography' ? (
                <span aria-label="Discography uses its built-in order" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  Fixed order
                </span>
              ) : (
                <button
                  type="button"
                  aria-label={`Change ${option.label} direction to ${nextDirection}`}
                  disabled={disabled}
                  onClick={() => changeDirection(index)}
                  style={{
                    minHeight: 34, padding: '6px 9px', borderRadius: 50,
                    background: 'var(--chip-bg-inactive)', border: '1px solid var(--border)',
                    color: 'var(--text-2)', fontFamily: 'inherit', fontSize: 11,
                    cursor: disabled ? 'default' : 'pointer',
                  }}
                >
                  {direction} {criterion.direction === 'asc' ? '↑' : '↓'}
                </button>
              )}

              <button
                type="button"
                aria-label={`Move ${option.label} sort earlier`}
                disabled={disabled || index === 0}
                onClick={() => move(index, -1)}
                style={controlStyle(disabled || index === 0)}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move ${option.label} sort later`}
                disabled={disabled || index === criteria.length - 1}
                onClick={() => move(index, 1)}
                style={controlStyle(disabled || index === criteria.length - 1)}
              >
                ↓
              </button>
              <button
                type="button"
                aria-label={`Remove ${option.label} sort`}
                disabled={disabled || criteria.length <= 1}
                onClick={() => remove(index)}
                style={controlStyle(disabled || criteria.length <= 1)}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={add}
        disabled={disabled || criteria.length >= SORT_OPTIONS.length}
        style={{
          minHeight: 34, padding: '6px 12px', borderRadius: 50,
          background: 'transparent', border: '1px dashed var(--border2)',
          color: 'var(--text-2)', fontFamily: 'inherit', fontSize: 11,
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        + Add sort level
      </button>

      <button
        type="button"
        onClick={toggleShortcuts}
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts (?)"
        className="tk-help-chip"
        style={{
          marginLeft: 'auto', width: 26, height: 26, borderRadius: 6,
          border: '1px solid var(--border)', background: 'transparent',
          color: 'var(--text-3)', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        ?
      </button>
    </div>
  );
}

function controlStyle(disabled: boolean): CSSProperties {
  return {
    width: 28, height: 30, padding: 0, borderRadius: 6,
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontFamily: 'inherit', fontSize: 14,
    cursor: disabled ? 'default' : 'pointer',
  };
}

export default SortCriteriaEditor;
