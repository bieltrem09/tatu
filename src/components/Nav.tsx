import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { goToAnchor, ScrollTrigger } from '../motion/setup'
import { CONTATO_MSG, waLink } from '../content/tatu'
import { Dialog } from './Dialog'

export const NAV_LINKS = [
  { id: 'empresa', label: 'Empresa' },
  { id: 'historia', label: 'História' },
  { id: 'produtos', label: 'Produtos' },
  { id: 'obras', label: 'Obras' },
  { id: 'fabrica', label: 'Fábrica' },
  { id: 'qualidade', label: 'Qualidade' },
  { id: 'contato', label: 'Contato' },
]

export function Logo({ light }: { light?: boolean }) {
  // Logo oficial (empresa.logo_topo) pendente: marca tipográfica provisória.
  return (
    <span className={`logo ${light ? 'logo--light' : ''}`} role="img" aria-label="Tatu PreMoldados">
      <span className="logo__word" aria-hidden="true">TATU</span>
      <span className="logo__sub mono" aria-hidden="true">PreMoldados</span>
    </span>
  )
}

export function onAnchorClick(e: MouseEvent<HTMLAnchorElement>, id: string, after?: () => void) {
  e.preventDefault()
  after?.()
  goToAnchor(id)
  history.replaceState(null, '', `#${id}`)
}

export function Nav() {
  const [hidden, setHidden] = useState(false)
  const [active, setActive] = useState<string>('')
  const [menu, setMenu] = useState(false)
  const menuBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - lastY) < 6) return
      setHidden(y > lastY && y > 160)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // Seção ativa: a que cruza o meio da viewport.
    const ids = ['inicio', ...NAV_LINKS.map((l) => l.id)]
    const triggers = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el && el.tagName === 'SECTION')
      .map((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: 'top 50%',
          end: 'bottom 50%',
          refreshPriority: -10,
          onToggle: (self) => self.isActive && setActive(el.id),
        }),
      )
    // "Empresa" vive dentro da abertura: marca ativa no último terço do pin.
    const onUpdate = () => {
      const ab = document.getElementById('inicio')
      if (!ab) return
      const r = ab.getBoundingClientRect()
      if (r.top < 0 && r.bottom > window.innerHeight * 0.5) {
        const p = -r.top / Math.max(1, r.height - window.innerHeight)
        setActive(p > 0.55 ? 'empresa' : 'inicio')
      }
    }
    window.addEventListener('scroll', onUpdate, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('scroll', onUpdate)
      triggers.forEach((t) => t.kill())
    }
  }, [])

  return (
    <header className={`nav ${hidden && !menu ? 'is-hidden' : ''}`}>
      <nav className="nav__pill" aria-label="Principal">
        <a href="#inicio" className="nav__logo" onClick={(e) => onAnchorClick(e, 'inicio')}>
          <Logo />
        </a>
        <ul className="nav__links">
          {NAV_LINKS.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                className={`nav__link ${active === l.id ? 'is-active' : ''}`}
                aria-current={active === l.id ? 'true' : undefined}
                onClick={(e) => onAnchorClick(e, l.id)}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a className="btn btn--primary nav__cta" href="#orcamento" onClick={(e) => onAnchorClick(e, 'orcamento')}>
          Orçamento
        </a>
        <button
          ref={menuBtn}
          type="button"
          className="nav__menu"
          aria-expanded={menu}
          aria-controls="menu-mobile"
          onClick={() => setMenu(true)}
        >
          <span className="sr-only">Abrir menu</span>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M3 8h18M3 16h18" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      </nav>
      {menu && (
        <Dialog
          label="Menu"
          variant="full"
          className="menu"
          onClose={() => {
            setMenu(false)
            requestAnimationFrame(() => menuBtn.current?.focus())
          }}
        >
          <div id="menu-mobile" className="menu__inner">
            <div className="menu__top">
              <Logo light />
              <button type="button" className="nav__menu nav__menu--light" onClick={() => setMenu(false)} data-autofocus="">
                <span className="sr-only">Fechar menu</span>
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </button>
            </div>
            <ul className="menu__links">
              {NAV_LINKS.map((l, i) => (
                <li key={l.id}>
                  <a href={`#${l.id}`} onClick={(e) => onAnchorClick(e, l.id, () => setMenu(false))}>
                    <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                    <span className="display">{l.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Dialog>
      )}
    </header>
  )
}

export function MobileBar() {
  return (
    <div className="mobilebar" role="region" aria-label="Contato rápido">
      <a className="btn btn--primary" href="#orcamento" onClick={(e) => onAnchorClick(e, 'orcamento')}>
        Orçamento
      </a>
      <a className="btn btn--dark" href={waLink(CONTATO_MSG)} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
    </div>
  )
}
