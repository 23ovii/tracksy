import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'tracksy_theme';

function resolveAndApply(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.remove('theme-light', 'theme-dark');
  root.classList.add(isDark ? 'theme-dark' : 'theme-light');
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'system';
    } catch {
      return 'system';
    }
  });

  useEffect(() => {
    resolveAndApply(theme);
    if (theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => resolveAndApply('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  function setTheme(next: Theme) {
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
    setThemeState(next);
  }

  return { theme, setTheme };
}
