import { useEffect, useRef, useState } from 'react';
import type { JSX, MouseEvent } from 'react';
import { useTheme } from '../hooks/useTheme.ts';
import type { Theme } from '../hooks/useTheme.ts';

// ── ThemeToggle ──────────────────────────────────────────────────────────────

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="4" />
    <line x1="12" y1="20" x2="12" y2="22" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="2" y1="12" x2="4" y2="12" />
    <line x1="20" y1="12" x2="22" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MonitorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const MoonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const THEME_OPTIONS: { value: Theme; label: string; Icon: () => JSX.Element }[] = [
  { value: 'light',  label: 'Light',  Icon: SunIcon },
  { value: 'dark',   label: 'Dark',   Icon: MoonIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="group"
      aria-label="Theme"
      style={{
        display: 'inline-flex',
        border: '1px solid var(--border2)',
        borderRadius: 50,
        background: 'var(--bg-inset)',
        padding: 2,
        gap: 1,
      }}
    >
      {THEME_OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            aria-label={label}
            title={label}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 22, height: 22, borderRadius: 50,
              border: active ? '1px solid var(--toggle-active-border)' : '1px solid transparent',
              background: active ? 'var(--toggle-active-bg)' : 'transparent',
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.25)' : 'none',
              color: active ? 'var(--text)' : 'var(--text-3)',
              cursor: 'pointer',
              transition: 'background 0.18s, color 0.18s, box-shadow 0.18s, border-color 0.18s',
            }}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}

// ── AccountMenu ──────────────────────────────────────────────────────────────

interface AccountMenuProps {
  avatarUrl: string | null;
  displayName: string | null;
  onSignOut: () => void;
  onWipe: () => void;
}

function AccountMenu({ avatarUrl, displayName, onSignOut, onWipe }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: globalThis.MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative', marginLeft: 4 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34, borderRadius: 50, padding: 0,
          border: open ? '2px solid var(--green)' : '2px solid var(--border2)',
          background: 'var(--surface2)',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'border-color 0.18s',
        }}
        onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
          if (!open) e.currentTarget.style.borderColor = 'rgba(29,185,84,0.6)';
        }}
        onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
          if (!open) e.currentTarget.style.borderColor = 'var(--border2)';
        }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName ?? 'Account'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ color: 'var(--text-3)', display: 'flex' }}><UserIcon /></span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            minWidth: 220,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            zIndex: 300,
          }}
        >
          {displayName && (
            <>
              <div className="sensitive" style={{ padding: '10px 16px 8px', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.01em' }}>
                {displayName}
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
            </>
          )}

          <div style={{ padding: '7px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Theme</span>
            <ThemeToggle />
          </div>

          <div style={{ height: 1, background: 'var(--border)' }} />

          <button
            role="menuitem"
            onClick={() => { setOpen(false); onSignOut(); }}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 16px',
              border: 'none', background: 'transparent',
              color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.14s, color 0.14s',
            }}
            onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.background = 'var(--border)';
              e.currentTarget.style.color = 'var(--text)';
            }}
            onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text)';
            }}
          >
            Sign out
          </button>

          <div style={{ height: 1, background: 'var(--border)' }} />

          <button
            role="menuitem"
            onClick={() => { setOpen(false); onWipe(); }}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 16px',
              border: 'none', background: 'transparent',
              color: '#ef4444', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.14s',
            }}
            onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
            }}
            onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Disconnect &amp; wipe data
          </button>
        </div>
      )}
    </div>
  );
}

export default AccountMenu;
