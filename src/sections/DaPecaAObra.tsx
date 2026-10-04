import { useLayoutEffect, useRef, useState } from 'react'
import { Cutout } from '../components/Cutout'
import { maskUrl, PendingPhoto, Picture } from '../components/Media'
import { altDe, asset, obras, produtoPorId } from '../content/tatu'
import { gsap, MQ, pinRegistry, prime, useGSAP } from '../motion/setup'
import { useIdle } from '../components/useIdle'
import './obra.css'

const pad = (n: number) => String(n).padStart(2, '0')
const TOTAL = obras.length

export function DaPecaAObra() {
  const root = useRef<HTMLElement>(null)
  const idle = useIdle()

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const mm = gsap.matchMedia()

      /** Monta a coreografia de um trecho numa timeline (0 → 1). */
      const build = (st: HTMLElement, tl: gsap.core.Timeline, at: number, len: number, exit: boolean) => {
        const T = (p: number) => at + p * len
        const piece = st.querySelector<HTMLElement>('.obra__piece')!
        const cut = st.querySelector<HTMLElement>('.obra__piece .cutout')!
        const masked = st.querySelector<HTMLElement>('.obra__masked')
        const full = st.querySelector<HTMLElement>('.obra__full')!
        const fullImg = full.querySelector<HTMLElement>('.obra__layers, .pending-photo')
        const proxy = { s: 1 }
        const applyMask = () => {
          if (!masked) return
          const w = cut.offsetWidth * proxy.s
          const h = cut.offsetHeight * proxy.s
          masked.style.maskSize = `${w}px ${h}px`
          masked.style.webkitMaskSize = `${w}px ${h}px`
        }
        applyMask()

        const words = st.querySelectorAll('.obra__word, .obra__labels .mask > *')
        const shade = st.querySelector('.obra__shade')
        const caps = st.querySelectorAll('.obra__caption .mask > *')
        const thumbs = [...st.querySelectorAll('.obra__thumb, .obra__hint')]

        // Estado inicial explícito (é para ele que o refresh do ScrollTrigger reverte)
        gsap.set(piece, { y: 120, scale: 0.94, opacity: 0 })
        gsap.set(words, { yPercent: 40, opacity: 0 })
        if (masked) gsap.set(masked, { opacity: 0 })
        gsap.set(full, { opacity: 0 })
        if (fullImg) gsap.set(fullImg, { scale: 1.08 })
        gsap.set(shade, { opacity: 0 })
        gsap.set(caps, { yPercent: 140 })
        if (thumbs.length) gsap.set(thumbs, { y: 160, opacity: 0 })
        gsap.set(st, { clipPath: 'inset(0% 0% 0% 0%)' })

        // 0–.15: a peça entra no estúdio
        tl.to(piece, { y: 0, scale: 1, opacity: 1, duration: 0.15 * len, ease: 'power2.out' }, T(0))
          .to(words, { yPercent: 0, opacity: 1, stagger: 0.01 * len, duration: 0.12 * len }, T(0.02))

        // .20–.55: técnica-chave 2 — a foto aparece dentro da silhueta e cresce até 7×
        if (masked) {
          tl.to(masked, { opacity: 1, duration: 0.03 * len }, T(0.2))
            .to(proxy, { s: 7, duration: 0.35 * len, ease: 'power2.in', onUpdate: applyMask }, T(0.2))
          // o recorte original some entre .24 e .32
          tl.to(piece, { opacity: 0, duration: 0.08 * len }, T(0.24))
        } else {
          tl.to(piece, { opacity: 0, scale: 0.96, duration: 0.1 * len }, T(0.3))
        }

        // .45–.60: a foto inteira assume com Ken Burns
        tl.to(full, { opacity: 1, duration: 0.15 * len }, T(0.45))
        if (fullImg) tl.to(fullImg, { scale: 1, duration: 0.4 * len }, T(0.45))

        // .60–.78: gradiente, legenda e miniaturas
        tl.to(shade, { opacity: 1, duration: 0.1 * len }, T(0.6))
          .to(caps, { yPercent: 0, stagger: 0.02 * len, duration: 0.12 * len, ease: 'power2.out' }, T(0.62))
        if (thumbs.length) tl.to(thumbs, { y: 0, opacity: 1, stagger: 0.03 * len, duration: 0.1 * len, ease: 'power2.out' }, T(0.62))

        // .90–1: cortina sobe e revela o estúdio da próxima peça
        if (exit) tl.to(st, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.1 * len, ease: 'power2.inOut' }, T(0.9))
      }

      mm.add(MQ.desktop, () => {
        const stage = q('.obra__stage')[0] as HTMLElement
        const stretches = q('.obra__stretch') as HTMLElement[]
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=380%',
            pin: stage,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })
        pinRegistry.obras = { st: tl.scrollTrigger!, anchors: { obras: 0 } }
        const len = 1 / TOTAL
        stretches.forEach((st, i) => build(st, tl, i * len, len, i < TOTAL - 1))
        const unprime = prime(tl)
        return () => {
          unprime()
          delete pinRegistry.obras
        }
      })

      mm.add(MQ.compact, () => {
        // Sem pin: cada trecho anima com um scrub curto ao entrar na tela
        const offs: (() => void)[] = []
        ;(q('.obra__stretch') as HTMLElement[]).forEach((st) => {
          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: st, start: 'top 70%', end: 'top 10%', scrub: 1, invalidateOnRefresh: true },
          })
          build(st, tl, 0, 1, false)
          offs.push(prime(tl))
        })
        return () => offs.forEach((f) => f())
      })

      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section id="obras" ref={root} className="obras" aria-labelledby="obras-title">
      <h2 id="obras-title" className="sr-only">
        Da peça à obra
      </h2>
      <div className="obra__stage">
        {obras.map((o, i) => (
          <Trecho key={o.produto} o={o} i={i} idle={idle} />
        ))}
      </div>
    </section>
  )
}

type Obra = (typeof obras)[number]

/**
 * Um trecho "da peça à obra". Quando há mais de uma foto, as miniaturas viram botões:
 * a escolhida cresce a partir da própria miniatura até ocupar a tela, e a foto que estava
 * em cena desce para o lugar dela.
 */
function Trecho({ o, i, idle }: { o: Obra; i: number; idle: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const prod = produtoPorId(o.produto)
  const nome = prod?.nome ?? o.produto
  const hasCut = !!asset(o.recorte)
  // galeria = foto principal + miniaturas que existem no kit; as pendentes ficam como aviso
  const galeria = [o.foto, ...o.miniaturas].filter((n) => asset(n))
  const pendentes = o.miniaturas.filter((n) => !asset(n))
  const [ordem, setOrdem] = useState(galeria)
  const [troca, setTroca] = useState<{ slot: number; from: string } | null>(null)
  const principal = ordem[0]
  const hasPhoto = !!principal

  const escolher = (slot: number) => {
    if (troca) return
    const next = [...ordem]
    ;[next[0], next[slot + 1]] = [next[slot + 1], next[0]]
    setTroca({ slot, from: ordem[0] })
    setOrdem(next)
  }

  // anima a troca logo após o React trocar as fotos (antes da pintura)
  useLayoutEffect(() => {
    if (!troca || !ref.current) return
    const st = ref.current
    const full = st.querySelector<HTMLElement>('.obra__full')!
    const layer = st.querySelector<HTMLElement>(`.obra__layer[data-foto="${ordem[0]}"]`)
    const old = st.querySelector<HTMLElement>(`.obra__layer[data-foto="${troca.from}"]`)
    const thumb = st.querySelectorAll<HTMLElement>('.obra__thumb')[troca.slot]
    const thumbPic = thumb?.querySelector<HTMLElement>('picture')
    const end = () => setTroca(null)
    if (!layer || !thumb || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      end()
      return
    }
    const f = full.getBoundingClientRect()
    const t = thumb.getBoundingClientRect()
    const inset = `inset(${((t.top - f.top) / f.height) * 100}% ${((f.right - t.right) / f.width) * 100}% ${((f.bottom - t.bottom) / f.height) * 100}% ${((t.left - f.left) / f.width) * 100}% round 6px)`
    const img = layer.querySelector('img')
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set([layer, old, img, thumbPic].filter(Boolean), { clearProps: 'all' })
        end()
      },
    })
    if (old) gsap.set(old, { visibility: 'visible', zIndex: 1 })
    gsap.set(layer, { zIndex: 2 })
    tl.fromTo(layer, { clipPath: inset }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 0.95, ease: 'expo.inOut' }, 0)
      .fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.3, ease: 'expo.out' }, 0.1)
    if (old) tl.to(old, { opacity: 0.35, duration: 0.8, ease: 'power2.in' }, 0)
    if (thumbPic) tl.fromTo(thumbPic, { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' }, 0.45)
    tl.fromTo(thumb, { y: 0 }, { y: -10, duration: 0.25, ease: 'power2.out', yoyo: true, repeat: 1, clearProps: 'y' }, 0.45)
    return () => {
      tl.kill()
    }
  }, [troca])

  const miniaturas = ordem.slice(1)
  return (
    <article ref={ref} className="obra__stretch studio" style={{ zIndex: TOTAL - i }} aria-label={`${nome}: ${o.legenda}`}>
      <span className="obra__word display" aria-hidden="true">
        {prod?.palavra}
      </span>
      <div className="obra__labels">
        <p className="mask">
          <span className="mono mono--accent">
            Da peça à obra · {pad(i + 1)} / {pad(TOTAL)}
          </span>
        </p>
        <p className="mask">
          <span className="mono mono--steel">A peça · {nome}</span>
        </p>
      </div>
      <div className="obra__piece piece-box">
        <Cutout name={o.recorte} sizes="(min-width: 1024px) 520px, 72vw" alt={nome} />
      </div>

      {hasPhoto && hasCut && (
        <div className="obra__masked" aria-hidden="true" style={idle ? { WebkitMaskImage: maskUrl(o.recorte), maskImage: maskUrl(o.recorte) } : undefined}>
          <Picture name={principal} sizes="100vw" alt="" />
        </div>
      )}
      <div className="obra__full">
        {hasPhoto ? (
          <div className="obra__layers">
            {galeria.map((n) => (
              <div key={n} className={`obra__layer ${n === principal ? 'is-on' : ''}`} data-foto={n} aria-hidden={n !== principal}>
                <Picture name={n} sizes="100vw" alt={n === principal ? undefined : ''} />
              </div>
            ))}
          </div>
        ) : (
          <PendingPhoto dark label={`Foto da obra · ${nome}`} sub="arquivo do kit pendente" className="obra__pending" />
        )}
      </div>
      <div className="obra__shade" aria-hidden="true" />
      <div className="obra__caption">
        <p className="mask">
          <span className="mono">A obra · {nome}</span>
        </p>
        <p className="mask">
          <span className="display obra__legend">{o.legenda}</span>
        </p>
      </div>
      {miniaturas.length + pendentes.length > 0 && (
        <div className="obra__gallery">
          {miniaturas.length > 0 && (
            <p className="obra__hint mono">
              <span aria-hidden="true">↻</span> Toque para trocar · {pad(galeria.indexOf(principal) + 1)} / {pad(galeria.length)}
            </p>
          )}
          <ul className="obra__thumbs">
            {miniaturas.map((m, k) => (
              <li key={k} className="obra__thumb" style={{ ['--r' as string]: `${k % 2 ? 3 : -4}deg` }}>
                <button type="button" className="obra__thumb-btn" onClick={() => escolher(k)} aria-label={`Ver foto: ${altDe(m)}`}>
                  <Picture name={m} sizes="240px" alt="" />
                </button>
              </li>
            ))}
            {pendentes.map((m, k) => (
              <li key={m} className="obra__thumb" style={{ ['--r' as string]: `${(miniaturas.length + k) % 2 ? 3 : -4}deg` }}>
                <PendingPhoto label="foto" sub="pendente" className="obra__thumb-pending" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
