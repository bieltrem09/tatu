import { useRef } from 'react'
import { Cutout } from '../components/Cutout'
import { SpecBox } from '../components/SpecBox'
import { Odometer } from '../components/Odometer'
import { useUI } from '../components/ui-store'
import { onAnchorClick } from '../components/Nav'
import { empresa, enderecoCurto, textoEmpresa, vantagens } from '../content/tatu'
import { EASE, gsap, MQ, pinRegistry, prime, useGSAP, willChangeDuring } from '../motion/setup'
import { cssColor, offsetWithin, vw } from '../motion/util'
import './abertura.css'

const LETTERS = ['T', 'A', 'T', 'U']
const TAGS = [
  { label: 'Blocos', id: 'produtos' },
  { label: 'Lajes', id: 'produtos' },
  { label: 'Pisos', id: 'produtos' },
  { label: 'Telhas', id: 'produtos' },
  { label: 'Guias', id: 'produtos' },
]

// Pontos das etiquetas sobre a peça (em % do recorte) — só posição, sem dados.
const CALLOUTS: { x: number; y: number; side: 'l' | 'r'; line: number }[] = [
  { x: 47, y: 13, side: 'l', line: 150 },
  { x: 15, y: 52, side: 'l', line: 64 },
  { x: 84, y: 58, side: 'r', line: 64 },
  { x: 54, y: 86, side: 'r', line: 150 },
]

const SPEC_ROWS = [
  { rotulo: 'Início', valor: String(empresa.inicio), nota: 'Pré-moldados de concreto' },
  { rotulo: 'Localização', valor: empresa.localizacao.km, nota: `${empresa.localizacao.rodovia} · ${empresa.localizacao.cidade}` },
  { rotulo: 'Certificação', valor: empresa.iso9001.norma, nota: `obtida em ${empresa.iso9001.ano}` },
]

export function Abertura() {
  const root = useRef<HTMLElement>(null)
  const { open } = useUI()

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const stage = q('.ab__stage')[0] as HTMLElement
      const piece = q('.ab__piece')[0] as HTMLElement

      /* ---------- Entrada ao carregar (não depende de scroll) ---------- */
      const mm = gsap.matchMedia()
      mm.add({ ...MQ }, (ctx) => {
        const { desktop, reduced } = ctx.conditions as Record<keyof typeof MQ, boolean>

        if (reduced) {
          gsap.from(stage, { opacity: 0, duration: 0.2 })
          return
        }

        const html = document.documentElement
        // a animação de segurança do CSS não pode brigar com o GSAP
        gsap.set(q('.ab__letter-in, .ab__kicker-in, .ab__side-in, .ab__piece-in'), { animation: 'none' })
        const intro = gsap.timeline({ defaults: { ease: EASE.enter }, onComplete: () => html.classList.remove('intro') })
        intro
          .fromTo(q('.ab__letter-in'), { yPercent: 140, y: 0 }, { yPercent: 0, y: 0, duration: 1.1, stagger: 0.06 }, 0)
          .fromTo(q('.ab__kicker-in'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.1 }, 0.1)
          .fromTo(q('.ab__piece-in'), { y: 140, rotate: -6 }, { y: 0, rotate: 0, duration: 1.4 }, 0.2)
          .fromTo(q('.ab__side-in'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.06 }, 0.35)

        if (!desktop) {
          // Compacto: varredura uma vez quando a peça entra na tela.
          const img = q('.ab__piece .cutout__img')[0]
          const mesh = q('.ab__piece .mesh')[0]
          const line = q('.ab__piece .scanline')[0]
          if (!mesh) return
          gsap
            .timeline({ scrollTrigger: { trigger: piece, start: 'top 75%', once: true }, delay: 1.2 })
            .set(mesh, { opacity: 1, clipPath: 'inset(0 0 0 0%)' })
            .set(img, { opacity: 0.15, clipPath: 'inset(0 100% 0 0)' })
            .set(line, { opacity: 1, xPercent: 0, left: 0 })
            .to(img, { clipPath: 'inset(0 0% 0 0)', duration: 1.6, ease: 'power2.inOut' }, 0)
            .to(mesh, { clipPath: 'inset(0 0 0 100%)', duration: 1.6, ease: 'power2.inOut' }, 0)
            .fromTo(line, { x: 0 }, { x: () => piece.offsetWidth, duration: 1.6, ease: 'power2.inOut' }, 0)
            .to(img, { opacity: 1, duration: 0.5 }, 1.2)
            .to(line, { opacity: 0, duration: 0.3 }, 1.5)
            .set(mesh, { opacity: 0 })
          return
        }

        /* ---------- Scroll (desktop): Hero → Scan → A empresa ---------- */
        const img = q('.ab__piece .cutout__img')[0]
        const mesh = q('.ab__piece .mesh')[0]
        const line = q('.ab__piece .scanline')[0]
        const flipYear = q('.ab__flipyear')[0] as HTMLElement
        const specYear = q('.ab__specs .specbox__row:first-child .specbox__value')[0] as HTMLElement
        const histYear = document.querySelector<HTMLElement>('#historia .hist__year .odo')
        const histStage = document.querySelector<HTMLElement>('#historia .hist__stage')

        const baseW = () => piece.offsetWidth
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=320%',
            pin: stage,
            // sem pin-spacer: o espaço vem do .ab__runway (CSS), então nada se move quando o JS liga o pin
            pinSpacing: false,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            ...willChangeDuring([piece, img, mesh, line, flipYear]),
          },
        })
        pinRegistry.abertura = { st: tl.scrollTrigger!, anchors: { inicio: 0, empresa: 0.78 } }

        // 0–.10: letras saem por máscara; linha e laterais somem
        tl.to(q('.ab__letter'), { yPercent: -140, stagger: 0.012, duration: 0.064, ease: 'power2.in' }, 0)
          .to(q('.ab__kicker, .ab__side'), { opacity: 0, y: -16, duration: 0.07 }, 0)

        // .06–.14: bloco desliza para x≈39% e cresce para ≈640px
        tl.to(piece, { x: () => vw() * (0.39 - 0.5), scale: () => Math.min(640, vw() * 0.42) / baseW(), duration: 0.08, ease: 'power2.inOut' }, 0.06)

        // .08–.12: malha aparece; foto cai para .15 ("fantasma")
        // .12–.40: varredura — foto real revelada por clip-path, malha recolhida pelo lado oposto
        const ghost = q('.ab__piece .cutout__ghost')[0]
        if (mesh) {
          gsap.set(img, { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' })
          gsap.set(mesh, { opacity: 0, clipPath: 'inset(0% 0% 0% 0%)' })
          gsap.set(ghost, { opacity: 0 })
          gsap.set(line, { opacity: 0, x: 0 })
          tl.to(mesh, { opacity: 1, duration: 0.04 }, 0.08)
            .to(ghost, { opacity: 0.15, duration: 0.04 }, 0.08)
            .to(img, { opacity: 0, duration: 0.04 }, 0.08)
            .set(img, { opacity: 1, clipPath: 'inset(0% 100% 0% 0%)' }, 0.12)
            .to(img, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.28 }, 0.12)
            .to(mesh, { clipPath: 'inset(0% 0% 0% 100%)', duration: 0.28 }, 0.12)
            .set(line, { opacity: 1 }, 0.12)
            .to(line, { x: () => baseW(), duration: 0.28 }, 0.12)
            .to(line, { opacity: 0, duration: 0.02 }, 0.4)
            .to(ghost, { opacity: 0, duration: 0.04 }, 0.4)
            // .44–.50: a malha some; foto a 100%
            .to(mesh, { opacity: 0, duration: 0.06 }, 0.44)
        }

        // .14–.20: rótulo + título do scan
        tl.from(q('.ab__scan .mask > *'), { yPercent: 140, stagger: 0.015, duration: 0.05, ease: 'power2.out' }, 0.14)

        // .28–.40: etiquetas com linha-guia em stagger
        q('.callout').forEach((c, i) => {
          const at = 0.28 + i * 0.025
          tl.from(c.querySelector('.callout__dot'), { scale: 0, duration: 0.015 }, at)
            .from(c.querySelector('.callout__line'), { scaleX: 0, duration: 0.03 }, at + 0.01)
            .from(c.querySelector('.callout__card'), { opacity: 0, x: c.classList.contains('callout--left') ? 12 : -12, duration: 0.03 }, at + 0.03)
        })

        // .50–.56: etiquetas e título saem
        tl.to(q('.callout'), { opacity: 0, duration: 0.05, stagger: 0.005 }, 0.5)
          .to(q('.ab__scan .mask > *'), { yPercent: -140, stagger: 0.01, duration: 0.05, ease: 'power2.in' }, 0.5)

        // .52–.70: bloco vai para x≈60%, encolhe ≈430px, rotate 3°
        tl.to(piece, { x: () => vw() * (0.6 - 0.5), scale: () => Math.min(430, vw() * 0.27) / baseW(), rotate: 3, duration: 0.18, ease: 'power2.inOut' }, 0.52)

        // .58–.74: texto da empresa por máscara de linhas
        tl.from(q('.ab__empresa .mask > *'), { yPercent: 140, stagger: 0.025, duration: 0.07, ease: 'power2.out' }, 0.58)
          .fromTo(q('.ab__empresa .ab__p'), { clipPath: 'inset(0 0 100% 0)', y: 24 }, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.08, ease: 'power2.out' }, 0.64)
          .from(q('.ab__empresa .btn'), { opacity: 0, y: 16, stagger: 0.02, duration: 0.05 }, 0.68)

        // .70–.80: caixa de especificações
        tl.from(q('.ab__specs .specbox'), { clipPath: 'inset(0 0 100% 0)', duration: 0.06, ease: 'power2.out' }, 0.7)
          .from(q('.ab__specs [data-spec-row]'), { opacity: 0, y: 14, stagger: 0.015, duration: 0.04 }, 0.72)

        // .86–1: "1977" voa até o ano gigante da História (FLIP); resto faz fade; bloco desce
        const flip = () => {
          const s = offsetWithin(specYear, stage)
          const t = histYear && histStage ? offsetWithin(histYear, histStage) : { x: vw() / 2 - 300, y: 120, w: 600, h: 300 }
          const scale = parseFloat(getComputedStyle(specYear).fontSize) / parseFloat(getComputedStyle(flipYear).fontSize)
          return { s, t, scale }
        }
        gsap.set(flipYear, { autoAlpha: 0 })
        tl.set(
          flipYear,
          {
            autoAlpha: 1,
            x: () => flip().s.x,
            y: () => flip().s.y,
            scale: () => flip().scale,
            color: () => cssColor('var(--ink)'),
          },
          0.86,
        )
          .to(
            flipYear,
            {
              x: () => flip().t.x,
              y: () => flip().t.y,
              scale: 1,
              color: () => cssColor('var(--accent)'),
              duration: 0.14,
              ease: 'power3.inOut',
            },
            0.86,
          )
          .set(specYear, { opacity: 0 }, 0.86)
          .to(q('.ab__empresa, .ab__specs'), { opacity: 0, duration: 0.06 }, 0.86)
          .to(piece, { y: () => window.innerHeight * 0.7, opacity: 0, duration: 0.12, ease: 'power2.in' }, 0.86)
          // último quadro: o palco some e revela a História (idêntica) por baixo
          .set(stage, { autoAlpha: 0 }, 0.998)
        const unprime = prime(tl)
        return () => {
          unprime()
          delete pinRegistry.abertura
        }
      })

      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section id="inicio" ref={root} className="abertura" aria-labelledby="hero-title">
      <div className="ab__stage studio">
        <p className="ab__kicker mono mono--steel">
          <span className="ab__kicker-in">{empresa.linha_hero}</span>
        </p>

        <h1 id="hero-title" className="ab__word" aria-label="Tatu PreMoldados">
          {LETTERS.map((l, i) => (
            <span className="mask mask--inline" key={i} aria-hidden="true">
              <span className="ab__letter">
                <span className="ab__letter-in">{l}</span>
              </span>
            </span>
          ))}
        </h1>

        <div className="ab__side ab__side--l">
          <div className="ab__side-in">
            <p className="ab__lead">Blocos, lajes, pisos, telhas e guias de concreto. {enderecoCurto}.</p>
            <a className="btn btn--primary" href="#orcamento" onClick={(e) => onAnchorClick(e, 'orcamento')}>
              Solicitar orçamento <span className="btn__arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <div className="ab__side ab__side--r">
          <div className="ab__side-in">
            <ul className="ab__tags" aria-label="Linha de produtos">
              {TAGS.map((t) => (
                <li key={t.label}>
                  <a className="pill" href={`#${t.id}`} onClick={(e) => onAnchorClick(e, t.id)}>
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
            <a className="ab__explore mono" href="#empresa" onClick={(e) => onAnchorClick(e, 'empresa')}>
              Explorar <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div className="ab__piece">
          <div className="ab__piece-in">
            <Cutout
              name="blocos"
              priority
              mesh
              scan
              sizes="(min-width: 1024px) 640px, 320px"
              alt="Blocos de concreto Tatu"
            />
            <ul className="ab__callouts" aria-hidden="true">
              {CALLOUTS.map((c, i) => (
                <li
                  key={i}
                  className={`callout callout--${c.side === 'l' ? 'left' : 'right'}`}
                  style={c.side === 'l' ? { right: `${100 - c.x}%`, top: `${c.y}%` } : { left: `${c.x}%`, top: `${c.y}%` }}
                >
                  <span className="callout__dot" />
                  <span className="callout__line" style={{ width: c.line }} />
                  <span className="callout__card">
                    <span className="mono mono--accent">{String(i + 1).padStart(2, '0')}</span>
                    {vantagens.itens[i]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="ab__scan">
          <p className="mask">
            <span className="mono mono--accent">{vantagens.titulo}</span>
          </p>
          <h2 className="display ab__scan-title">
            <span className="mask"><span>Bloco de</span></span>
            <span className="mask"><span>concreto</span></span>
          </h2>
          <ol className="ab__vlist">
            {vantagens.itens.map((v, i) => (
              <li key={v}>
                <span className="mono mono--accent">{String(i + 1).padStart(2, '0')}</span> {v}
              </li>
            ))}
          </ol>
        </div>

        <div className="ab__empresa" id="empresa">
          <p className="mask">
            <span className="mono mono--accent">A empresa</span>
          </p>
          <h2 className="display h2 ab__h2">
            <span className="mask"><span>Desde</span></span>
            <span className="mask"><span>{empresa.inicio}</span></span>
          </h2>
          <p className="ab__p lede">{textoEmpresa}</p>
          <div className="btn-row">
            <a className="btn btn--dark" href="#historia" onClick={(e) => onAnchorClick(e, 'historia')}>
              Ver a linha do tempo
            </a>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={(e) => open({ type: 'video', id: empresa.video.youtube_id, title: empresa.video.titulo }, e.currentTarget)}
            >
              <span className="btn__arrow" aria-hidden="true">▶</span> Assistir ao vídeo
            </button>
          </div>
        </div>

        <aside className="ab__specs" aria-label="Dados da empresa">
          <SpecBox title="Ficha" aside="Tatu" rows={SPEC_ROWS} />
        </aside>

        <span className="ab__flipyear display" aria-hidden="true">
          <Odometer value={empresa.inicio} />
        </span>
      </div>
      <div className="ab__runway" aria-hidden="true" />
    </section>
  )
}
