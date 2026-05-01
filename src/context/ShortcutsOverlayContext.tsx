import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface CtxValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}

const Ctx = createContext<CtxValue>({ open: false, setOpen: () => {}, toggle: () => {} });

export function ShortcutsOverlayProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);
  return <Ctx.Provider value={{ open, setOpen, toggle }}>{children}</Ctx.Provider>;
}

export const useShortcutsOverlay = () => useContext(Ctx);
