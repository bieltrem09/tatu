import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type Modal =
  | { type: 'video'; id: string; title: string }
  | { type: 'produto'; id: string }
  | { type: 'pontos' }
  | { type: 'doc'; index: number }
  | null

type UI = {
  modal: Modal
  open: (m: NonNullable<Modal>, opener?: HTMLElement | null) => void
  close: () => void
}

const Ctx = createContext<UI | null>(null)
let lastOpener: HTMLElement | null = null

export function UIProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<Modal>(null)
  const open = useCallback<UI['open']>((m, opener) => {
    lastOpener = opener ?? (document.activeElement as HTMLElement | null)
    setModal(m)
  }, [])
  const close = useCallback(() => {
    setModal(null)
    // Restaura o foco para quem abriu
    requestAnimationFrame(() => lastOpener?.focus({ preventScroll: true }))
  }, [])
  const value = useMemo(() => ({ modal, open, close }), [modal, open, close])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useUI() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useUI fora do UIProvider')
  return v
}
