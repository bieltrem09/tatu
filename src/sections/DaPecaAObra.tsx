import { useRef } from 'react'
import { Cutout } from '../components/Cutout'
import { maskUrl, PendingPhoto, Picture } from '../components/Media'
import { asset, obras, produtoPorId } from '../content/tatu'
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
        const fullImg = full.querySelector<HTMLElement>('img, .pending-photo')
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
        const thumbs = [...st.querySelectorAll('.obra__thumb')]

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
        if (thumbs.length) tl.to(thumbs, { y: 0, opacity: 1, stagger: 0.03 * len, duration: 0.12 * len, ease: 'power2.out' }, T(0.66))

        // .86–1: cortina sobe e revela o estúdio da próxima peça
        if (exit) tl.to(st, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.14 * len, ease: 'power2.inOut' }, T(0.86))
      }

      mm.add(MQ.desktop, () => {
        const stage = q('.obra__stage')[0] as HTMLElement
        const stretches = q('.obra__stretch') as HTMLElement[]
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=320%',
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
        {obras.map((o, i) => {
          const prod = produtoPorId(o.produto)
          const nome = prod?.nome ?? o.produto
          const hasPhoto = !!asset(o.foto)
          const hasCut = !!asset(o.recorte)
          return (
            <article className="obra__stretch studio" key={o.produto} style={{ zIndex: TOTAL - i }} aria-label={`${nome}: ${o.legenda}`}>
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
                  <Picture name={o.foto} sizes="100vw" alt="" />
                </div>
              )}
              <div className="obra__full">
                {hasPhoto ? (
                  <Picture name={o.foto} sizes="100vw" />
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
              {o.miniaturas.length > 0 && (
                <ul className="obra__thumbs">
                  {o.miniaturas.map((m, k) => (
                    <li key={m} className="obra__thumb" style={{ ['--r' as string]: `${k % 2 ? 3 : -4}deg` }}>
                      {asset(m) ? <Picture name={m} sizes="240px" /> : <PendingPhoto label="foto" sub="pendente" className="obra__thumb-pending" />}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
