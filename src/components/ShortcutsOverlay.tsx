import { useEffect, useRef } from 'react';
import { useShortcutsOverlay } from '../context/ShortcutsOverlayContext';
import { SORT_OPTIONS } from '../utils/playlistUtils';

const GROUPS = [
  {
    label: 'Sort',
    items: [
      ...SORT_OPTIONS.map((opt, i) => ({ keys: [String(i + 1)], desc: `Sort by ${opt.label}` })),
      { keys: ['D'], desc: 'Toggle sort direction (asc / desc)' },
    ],
  },
  {
    label: 'Actions',
    items: [
      { keys: ['Enter'], desc: 'Apply sort to Spotify' },
      { keys: ['Esc'], desc: 'Back to library' },
      { keys: ['/'], desc: 'Open / focus filter' },
    ],
  },
  {
    label: 'Help',
    items: [{ keys: ['?'], desc: 'Show / hide this overlay' }],
  },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 24, height: 22, padding: '0 6px',
      background: 'var(--border)',
      border: '1px solid var(--border2)',
      borderBottom: '2px solid var(--border2)',
      borderRadius: 5,
      fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
      color: 'var(--text-2)', letterSpacing: '0.02em',
    }}>
      {children}
    </kbd>
  );
}

export default function ShortcutsOverlay() {
  const { open, setOpen } = useShortcutsOverlay();
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        e.stopImmediatePropagation();
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) setOpen(false); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'var(--modal-backdrop)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--border2)',
        borderRadius: 18,
        boxShadow: 'var(--shadow-card)',
        width: '100%', maxWidth: 420, margin: 16,
        overflow: 'hidden',
        animation: 'scaleIn 0.14s ease-out',
        willChange: 'transform',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        <div style={{
          padding: '18px 24px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Keyboard shortcuts</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close shortcuts overlay"
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-3)', fontSize: 20, lineHeight: 1,
              cursor: 'pointer', padding: 4, borderRadius: 4,
            }}
          >×</button>
        </div>

        <div style={{ padding: '14px 24px 22px' }}>
          {GROUPS.map((group, gi) => (
            <div key={group.label} style={{ marginBottom: gi < GROUPS.length - 1 ? 20 : 0 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                color: 'var(--text-3)', textTransform: 'uppercase',
                marginBottom: 8,
              }}>
                {group.label}
              </div>
              {group.items.map((item) => (
                <div key={item.desc} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 0',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{item.desc}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {item.keys.map((k) => <Kbd key={k}>{k}</Kbd>)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
