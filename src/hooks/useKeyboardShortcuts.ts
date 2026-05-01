import { useEffect, useRef } from 'react';

type Shortcuts = Record<string, () => void>;

function defaultShouldIgnore(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement;
  return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
}

export function useKeyboardShortcuts(
  shortcuts: Shortcuts,
  shouldIgnore: (e: KeyboardEvent) => boolean = defaultShouldIgnore,
) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;
  const ignoreRef = useRef(shouldIgnore);
  ignoreRef.current = shouldIgnore;

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (ignoreRef.current(e)) return;

      const mods: string[] = [];
      if (e.ctrlKey) mods.push('ctrl');
      if (e.altKey) mods.push('alt');
      if (e.shiftKey) mods.push('shift');
      mods.push(e.key.toLowerCase());
      const chord = mods.join('+');

      const fn = shortcutsRef.current[chord] ?? shortcutsRef.current[e.key.toLowerCase()];
      if (fn) {
        e.preventDefault();
        fn();
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
