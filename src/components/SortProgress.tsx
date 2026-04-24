import { useState, useEffect } from 'react';

interface SortProgressProps {
  active: boolean;
  label: string | undefined;
  onDone: () => void;
}

function SortProgress({ active, label, onDone }: SortProgressProps) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!active) { setPct(0); return; }
    const start = Date.now();
    const dur = 1800;
    let rafId: number;
    function tick() {
      const p = Math.min(100, ((Date.now() - start) / dur) * 100);
      setPct(p);
      if (p < 100) {
        rafId = requestAnimationFrame(tick);
      } else {
        setTimeout(onDone, 150);
      }
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active]);

  if (!active && pct === 0) return null;

  return (
    <div style={{
      padding: '14px 24px',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(29,185,84,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
        <span style={{ color: 'var(--green)', fontWeight: 600 }}>
          Sorting by <strong>{label}</strong>
        </span>
        <span style={{ color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(pct)}%
        </span>
      </div>
      <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'linear-gradient(90deg, var(--green), #5af5a0)',
          borderRadius: 2,
          transition: 'width 0.05s linear',
        }} />
      </div>
    </div>
  );
}

export default SortProgress;
