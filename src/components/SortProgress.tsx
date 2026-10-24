import { useEffect, useRef } from 'react';

interface SortProgressProps {
  active: boolean;
  progress: number; // 0–100, controlled by caller
  label: string | undefined;
  onDone: () => void;
  color?: string;
  colorEnd?: string;
  rateLimitMsg?: string;
}

function SortProgress({ active, progress, label, onDone, color = '#1db954', colorEnd = '#5af5a0', rateLimitMsg }: SortProgressProps) {
  const doneFired = useRef(false);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) {
      doneFired.current = false;
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
      return;
    }
    if (progress >= 100 && !doneFired.current) {
      doneFired.current = true;
      doneTimerRef.current = setTimeout(onDone, 300);
    }
  }, [active, progress, onDone]);

  useEffect(() => () => {
    if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
  }, []);

  if (!active && progress === 0) return null;

  return (
    <div style={{
      padding: '14px 24px',
      borderBottom: '1px solid var(--border)',
      background: `linear-gradient(90deg, ${color}12, ${color}04)`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12, position: 'relative' }}>
        <span style={{ color, fontWeight: 600, letterSpacing: '-0.1px' }}>
          {rateLimitMsg
            ? <span role="status" aria-live="polite" style={{ color: '#f59e0b' }}>{rateLimitMsg}</span>
            : <>Sorting by <strong style={{ fontWeight: 800 }}>{label}</strong></>
          }
        </span>
        <span style={{ color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(progress)}%
        </span>
      </div>
      <div style={{
        height: 4, background: 'var(--border)',
        borderRadius: 2, overflow: 'hidden', position: 'relative',
      }}
        role="progressbar"
        aria-label={`Sorting by ${label ?? 'selected sort'}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${color}, ${colorEnd})`,
          borderRadius: 2,
          transition: 'width 0.2s ease-out',
          boxShadow: `0 0 10px ${color}aa`,
        }} />
      </div>
    </div>
  );
}

export default SortProgress;
