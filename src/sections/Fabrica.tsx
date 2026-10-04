import { useRef } from 'react'
import { PendingPhoto, Picture } from '../components/Media'
import { useUI } from '../components/ui-store'
import { AERIAL_SRC, asset, enderecoCurto, estrutura } from '../content/tatu'
import { gsap, MQ, pinRegistry, prime, useGSAP } from '../motion/setup'
import './fabrica.css'

/**
 * Polígono do telhado solar em % da foto aérea. ESTIMATIVA visual sobre a foto do kit:
 * troque pelas coordenadas do JSON (estrutura.energia_solar.poligono) quando houver.
 */
const SOLAR_POLY: [number, number][] = [
  [60, 76],
  [71, 62],
  [91, 68],
  [75, 86],
]
const AERIAL_RATIO = asset(AERIAL_SRC) ? asset(AERIAL_SRC)!.width / asset(AERIAL_SRC)!.height : 550 / 413
const CENTROID = SOLAR_POLY.reduce((a, [x, y]) => [a[0] + x / SOLAR_POLY.length, a[1] + y / SOLAR_POLY.length], [0, 0])

// Capacidades por ponto — nunca somadas (estrutura.conflito_conhecido)
const CAPS = ['03', '14', '15', '02'].map((n) => estrutura.pontos.find((p) => p.n === n)!).filter(Boolean)
const num = (s: string) => Number(s.replace(/\./g, ''))
const fmt = (n: number) => Math.round(n).toLocaleString('pt-BR')

export function Fabrica() {
  const root = useRef<HTMLElement>(null)
  const { open } = useUI()
  const solar = estrutura.energia_solar

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const mm = gsap.matchMedia()
      const counters = (q('[data-count]') as HTMLElement[]).map((el) => ({ el, to: Number(el.dataset.count), v: { n: 0 } }))
      const setCount = (c: (typeof counters)[number]) => (c.el.textContent = fmt(c.v.n))

      mm.add(MQ.desktop, () => {
        const stage = q('.fab__stage')[0] as HTMLElement
        const cam = q('.fab__cam')[0] as HTMLElement
        const box = q('.fab__box')[0] as HTMLElement
        const callout = q('.fab__callout')[0] as HTMLElement
        const Z = 2

        // Câmera: escala z e translate que leva o telhado solar ao centro, limitado às bordas
        const camAt = (z: number) => {
          const W = stage.offsetWidth
          const H = stage.offsetHeight
          // a caixa é centralizada (translate -50%) — offsetLeft não enxerga isso
          const L = (W - box.offsetWidth) / 2
          const Tp = (H - box.offsetHeight) / 2
          const bx = L + (CENTROID[0] / 100) * box.offsetWidth
          const by = Tp + (CENTROID[1] / 100) * box.offsetHeight
          // origem no centro do palco
          let tx = (W / 2 - bx) * z
          let ty = (H / 2 - by) * z
          // borda da imagem nunca aparece
          const maxX = (box.offsetWidth * z - W) / 2 + (W / 2 - (L + box.offsetWidth / 2)) * z
          const minX = -(box.offsetWidth * z - W) / 2 + (W / 2 - (L + box.offsetWidth / 2)) * z
          const maxY = (box.offsetHeight * z - H) / 2 + (H / 2 - (Tp + box.offsetHeight / 2)) * z
          const minY = -(box.offsetHeight * z - H) / 2 + (H / 2 - (Tp + box.offsetHeight / 2)) * z
          tx = Math.min(maxX, Math.max(minX, tx))
          ty = Math.min(maxY, Math.max(minY, ty))
          return { tx, ty, sx: W / 2 + (bx - W / 2) * z + tx, sy: H / 2 + (by - H / 2) * z + ty }
        }
        const state = { t: 0 }
        const render = () => {
          const z = Math.pow(2, 1 - state.t) // z = 2^(1-t): recuo exponencial
          const { tx, ty } = camAt(z)
          gsap.set(cam, { x: tx, y: ty, scale: z })
        }
        const place = () => {
          const { sx, sy } = camAt(Z)
          callout.style.left = `${sx}px`
          callout.style.top = `${sy}px`
        }

        const solarCounter = counters.find((c) => c.el.closest('.fab__callout'))!
        const capCounters = counters.filter((c) => c.el.closest('.fab__caps'))

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=220%',
            pin: stage,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: () => {
              place()
              render()
            },
          },
        })
        pinRegistry.fabrica = { st: tl.scrollTrigger!, anchors: { fabrica: 0.52 } }
        place()
        render()

        // 0–.16: close no telhado solar + scan isométrico + etiqueta com contador
        gsap.set(q('.fab__solar'), { opacity: 1 })
        gsap.set(q('.fab__solar-grid'), { clipPath: 'inset(0% 100% 0% 0%)' })
        tl.to(q('.fab__solar-grid'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.1 }, 0.01)
          .from(callout.querySelector('.callout__dot'), { scale: 0, duration: 0.02 }, 0.04)
          .from(callout.querySelector('.callout__line'), { scaleX: 0, duration: 0.03 }, 0.05)
          .from(callout.querySelector('.callout__card'), { opacity: 0, x: -12, duration: 0.03 }, 0.07)
          .fromTo(solarCounter.v, { n: 0 }, { n: solarCounter.to, duration: 0.08, onUpdate: () => setCount(solarCounter) }, 0.07)
          // .16–.56: a câmera recua até 1×; a etiqueta sai
          .to(callout, { opacity: 0, duration: 0.04 }, 0.16)
          .to(q('.fab__solar'), { opacity: 0, duration: 0.1 }, 0.4)
          .fromTo(state, { t: 0 }, { t: 1, duration: 0.4, ease: 'power1.inOut', onUpdate: render }, 0.16)
          // .50–.64: gradiente escuro + título, endereço e botões
          .fromTo(q('.fab__shade'), { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.5)
          .from(q('.fab__text .mask > *'), { yPercent: 140, stagger: 0.015, duration: 0.08, ease: 'power2.out' }, 0.52)
          // .66–.84: capacidades com contagem progressiva
          .from(q('.fab__cap'), { opacity: 0, y: 30, stagger: 0.02, duration: 0.06 }, 0.66)
        capCounters.forEach((c, i) => tl.fromTo(c.v, { n: 0 }, { n: c.to, duration: 0.12, onUpdate: () => setCount(c) }, 0.68 + i * 0.02))
        const unprime = prime(tl)
        counters.forEach(setCount)
        render()

        return () => {
          unprime()
          callout.style.left = ''
          callout.style.top = ''
          delete pinRegistry.fabrica
        }
      })

      mm.add(MQ.compact, () => {
        gsap.fromTo(q('.fab__cam'), { scale: 1.4 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: q('.fab__stage')[0], start: 'top bottom', end: 'center center', scrub: 1 } })
        counters.forEach((c) =>
          gsap.fromTo(c.v, { n: 0 }, { n: c.to, duration: 1.6, ease: 'power2.out', onUpdate: () => setCount(c), scrollTrigger: { trigger: c.el, start: 'top 85%', once: true } }),
        )
      })

      return () => mm.revert()
    },
    { scope: root },
  )

  const hasAerial = !!asset(AERIAL_SRC)

  return (
    <section id="fabrica" ref={root} className="fabrica" aria-labelledby="fabrica-title">
      <div className="fab__stage">
        <div className="fab__view">
          <div className="fab__cam">
            <div className="fab__box" style={{ aspectRatio: String(AERIAL_RATIO), ['--ar' as string]: AERIAL_RATIO }}>
              {hasAerial ? (
                <Picture name={AERIAL_SRC} sizes="100vw" className="fab__img" />
              ) : (
                <PendingPhoto dark label="Vista aérea da fábrica" sub="fabrica-aerea.jpg pendente" className="fab__img" />
              )}
              <div className="fab__solar" aria-hidden="true" style={{ clipPath: `polygon(${SOLAR_POLY.map(([x, y]) => `${x}% ${y}%`).join(',')})` }}>
                <div className="fab__solar-grid" />
              </div>
            </div>
          </div>
          <div className="fab__shade" aria-hidden="true" />
        </div>

        <div className="fab__callout callout" role="note">
          <span className="callout__dot" />
          <span className="callout__line" style={{ width: 90 }} />
          <span className="callout__card fab__callout-card">
            <span className="mono mono--accent">Energia solar · investimento de {solar.ano}</span>
            <span className="fab__solar-num display">
              +<span data-count={solar.area_m2}>{fmt(solar.area_m2)}</span> m²
            </span>
            <span className="fab__solar-note">{solar.nota}</span>
          </span>
        </div>

        <div className="fab__text">
          <p className="mask">
            <span className="mono">Estrutura</span>
          </p>
          <h2 id="fabrica-title" className="mask">
            <span className="display fab__title">A fábrica</span>
          </h2>
          <p className="mask">
            <span className="fab__addr">{enderecoCurto}</span>
          </p>
          <div className="mask">
            <div className="btn-row">
              <button
                type="button"
                className="btn btn--light"
                onClick={(e) => open({ type: 'video', id: estrutura.video_fabrica.youtube_id, title: estrutura.video_fabrica.titulo }, e.currentTarget)}
              >
                <span className="btn__arrow" aria-hidden="true">▶</span> Assistir: {estrutura.video_fabrica.titulo}
              </button>
              <button type="button" className="btn btn--ghost-light" onClick={(e) => open({ type: 'pontos' }, e.currentTarget)}>
                Ver os {estrutura.total_pontos} pontos
              </button>
            </div>
          </div>
        </div>

        <ul className="fab__caps" aria-label="Capacidades por ponto da fábrica (não somadas)">
          {CAPS.map((c) => (
            <li className="fab__cap" key={c.n}>
              <span className="display fab__cap-num">
                <span data-count={num(c.capacidade)}>{c.capacidade}</span>
              </span>
              <span className="fab__cap-unit">{c.unidade}</span>
              <span className="mono fab__cap-pt">Ponto {c.n}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
