import { useState, useEffect, useRef } from 'react';

import { SORT_OPTIONS } from '../../utils/playlistUtils';
import { UNDO_WINDOW_MS } from '../../utils/constants.ts';

interface UndoToastProps {
  undoUntil: number;
  sortBy: string;
  accent: string;
  accent2: string;
  onUndo: () => void;
  onDismiss: () => void;
}

function UndoToast({ undoUntil, sortBy, accent, accent2, onUndo, onDismiss }: UndoToastProps) {
  const [hovered, setHovered] = useState(false);
  const [, setTick] = useState(0);
  // local copy so hover-pause can extend it without touching parent state
  const [localUntil, setLocalUntil] = useState(undoUntil);
  const hoverStartRef = useRef<number | null>(null);

  useEffect(() => setLocalUntil(undoUntil), [undoUntil]);

  useEffect(() => {
    if (hovered) return;
    const id = setInterval(() => {
      if (Date.now() >= localUntil) {
        clearInterval(id);
        onDismiss();
      } else {
        setTick((t) => t + 1);
      }
    }, 50);
    return () => clearInterval(id);
  }, [hovered, localUntil, onDismiss]);

  const pct = Math.max(0, (localUntil - Date.now()) / UNDO_WINDOW_MS) * 100;
  const label = SORT_OPTIONS.find((o) => o.id === sortBy)?.label;

  return (
    <div
      onMouseEnter={() => {
        hoverStartRef.current = Date.now();
        setHovered(true);
      }}
      onMouseLeave={() => {
        if (hoverStartRef.current !== null) {
          const paused = Date.now() - hoverStartRef.current;
          hoverStartRef.current = null;
          setLocalUntil((prev) => prev + paused);
        }
        setHovered(false);
      }}
      style={{
        position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        zIndex: 100, minWidth: 300, maxWidth: 440,
        background: 'var(--glass-bg)',
        border: '1px solid var(--border2)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        animation: 'toastIn 0.3s var(--ease-out)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div style={{ padding: '12px 10px 12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
          Sorted by{' '}
          <strong style={{ color: accent }}>{label}</strong>
          . Undo?
        </span>
        <button
          onClick={onUndo}
          style={{
            padding: '5px 12px',
            background: `${accent}18`,
            border: `1px solid ${accent}44`,
            borderRadius: 7,
            color: accent,
            fontSize: 12, fontWeight: 700,
            cursor: 'pointer', flexShrink: 0,
            letterSpacing: '-0.1px',
          }}
        >Undo</button>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, flexShrink: 0,
            background: 'none', border: 'none',
            color: 'var(--text-3)', fontSize: 18, lineHeight: 1,
            cursor: 'pointer', borderRadius: 4,
          }}
        >×</button>
      </div>
      <div style={{ height: 3, background: 'var(--border)' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${accent}, ${accent2})`,
          transition: 'width 0.1s linear',
        }} />
      </div>
    </div>
  );
}

export default UndoToast;
