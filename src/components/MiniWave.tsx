interface MiniWaveProps {
  value: number;
  color?: string;
}

function MiniWave({ value, color = '#1db954' }: MiniWaveProps) {
  const bars = 8;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = Math.max(3, Math.round(
          value * 16 * (0.4 + 0.6 * Math.abs(Math.sin(i * 1.2 + value * 5)))
        ));
        return (
          <div key={i} style={{
            width: 3, height: h, borderRadius: 2,
            background: i / bars <= value ? color : 'var(--border2)',
            transition: 'height 0.4s ease',
          }} />
        );
      })}
    </div>
  );
}

export default MiniWave;
