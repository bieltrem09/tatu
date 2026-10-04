import { useEffect, useRef, type ReactNode, type KeyboardEvent } from 'react'
import { getLenis } from '../motion/setup'

type Props = {
  label: string
  onClose: () => void
  children: ReactNode
  variant?: 'center' | 'drawer' | 'full'
  className?: string
  onKey?: (e: KeyboardEvent) => void
}

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, iframe, [tabindex]:not([tabindex="-1"])'

/** Diálogo acessível: foco preso, Esc fecha, scroll da página travado. */
export function Dialog({ label, onClose, children, variant = 'center', className, onKey }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    const first = el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus({ preventScroll: true })
    getLenis()?.stop()
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      getLenis()?.start()
      document.documentElement.style.overflow = prev
    }
  }, [])

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key === 'Tab' && ref.current) {
      const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null || n === document.activeElement)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    onKey?.(e)
  }

  return (
    <div className={`dialog dialog--${variant}`} onKeyDown={handleKey}>
      <div className="dialog__scrim" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className={`dialog__panel ${className ?? ''}`} role="dialog" aria-modal="true" aria-label={label} data-lenis-prevent="">
        {children}
      </div>
    </div>
  )
}

export function CloseButton({ onClick, light }: { onClick: () => void; light?: boolean }) {
  return (
    <button type="button" className={`dialog__close ${light ? 'dialog__close--light' : ''}`} onClick={onClick} aria-label="Fechar">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </button>
  )
}
