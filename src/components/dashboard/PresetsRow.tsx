import { useState, useRef, useEffect } from 'react';
import type { MouseEvent, KeyboardEvent } from 'react';
import type { SortPreset } from '../../services/presets';

interface PresetsRowProps {
  presets: SortPreset[];
  onLoad: (preset: SortPreset) => void;
  onDelete: (id: string) => void;
  onSave: (name: string) => void;
}

function PresetsRow({ presets, onLoad, onDelete, onSave }: PresetsRowProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const visible = presets.length > 0 || adding;
  if (!visible) {
    return (
      <div style={{ padding: '10px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <SaveChip onClick={() => setAdding(true)} />
      </div>
    );
  }

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) { setAdding(false); setName(''); return; }
    onSave(trimmed);
    setAdding(false);
    setName('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setAdding(false); setName(''); }
  }

  return (
    <div style={{
      padding: '10px 24px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
      background: 'rgba(8, 11, 16, 0.25)',
    }}>
      <span style={{
        fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
        letterSpacing: '0.18em', textTransform: 'uppercase',
        alignSelf: 'center', marginRight: 4, flexShrink: 0,
      }}>Presets</span>

      {presets.map((preset) => (
        <PresetChip key={preset.id} preset={preset} onLoad={onLoad} onDelete={onDelete} />
      ))}

      {adding ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            placeholder="Preset name"
            maxLength={40}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 50,
              padding: '5px 12px',
              fontSize: 12, color: 'var(--text)',
              fontFamily: 'inherit',
              outline: 'none',
              width: 140,
            }}
          />
        </div>
      ) : (
        <SaveChip onClick={() => setAdding(true)} />
      )}
    </div>
  );
}

function SaveChip({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', borderRadius: 50,
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed rgba(255,255,255,0.12)',
        color: 'var(--text-3)', fontSize: 11.5, fontWeight: 600,
        fontFamily: 'inherit', cursor: 'pointer',
        transition: 'color 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.color = 'var(--text-2)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
      }}
      onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.color = 'var(--text-3)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
      }}
    >
      + Save current sort
    </button>
  );
}

function PresetChip({ preset, onLoad, onDelete }: {
  preset: SortPreset;
  onLoad: (p: SortPreset) => void;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center',
        borderRadius: 50,
        background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.09)',
        transition: 'background 0.15s',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={() => onLoad(preset)}
        title={`${preset.sortBy} ${preset.sortDir}`}
        style={{
          padding: '5px 8px 5px 12px',
          background: 'none', border: 'none',
          color: 'var(--text-2)', fontSize: 12, fontWeight: 500,
          fontFamily: 'inherit', cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {preset.name}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(preset.id); }}
        aria-label={`Delete preset ${preset.name}`}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: hovered ? 20 : 0,
          padding: hovered ? '0 6px 0 0' : 0,
          overflow: 'hidden',
          background: 'none', border: 'none',
          color: 'var(--text-3)', fontSize: 14, lineHeight: 1,
          cursor: 'pointer',
          transition: 'width 0.15s, padding 0.15s, color 0.15s',
          fontFamily: 'inherit',
        }}
        onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.color = '#ff6b6b';
        }}
        onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.color = 'var(--text-3)';
        }}
      >
        ×
      </button>
    </div>
  );
}

export default PresetsRow;
