import { useState, useEffect } from 'react';

interface SortProgressProps {
  active: boolean;
  label: string | undefined;
  onDone: () => void;
  color?: string;
  colorEnd?: string;
}

function SortProgress({ active, label, onDone, color = '#1db954', colorEnd = '#5af5a0' }: SortProgressProps) {
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
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: `linear-gradient(90deg, ${color}12, ${color}04)`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12, position: 'relative' }}>
        <span style={{ color, fontWeight: 600, letterSpacing: '-0.1px' }}>
          Sorting by <strong style={{ fontWeight: 800 }}>{label}</strong>
        </span>
        <span style={{ color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(pct)}%
        </span>
      </div>
      <div style={{
        height: 4, background: 'rgba(255,255,255,0.06)',
        borderRadius: 2, overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${colorEnd})`,
          borderRadius: 2,
          transition: 'width 0.05s linear',
          boxShadow: `0 0 10px ${color}aa`,
        }} />
      </div>
    </div>
  );
}

export default SortProgress;
