import { useEffect, useRef } from 'react'
import { useUI } from '../components/ui-store'
import framesManifest from '../content/frames.gen.json'
import { empresa } from '../content/tatu'
import { gsap, MQ, pinRegistry, prime, ScrollTrigger, useGSAP } from '../motion/setup'
import './producao.css'

type Frames = { count: number; start?: number; end?: number; ratio?: number }
const frames = framesManifest as Frames
const pad = (n: number) => String(n).padStart(3, '0')
const url = (dir: 'd' | 'm', i: number) => `${import.meta.env.BASE_URL}img/frames/${dir}/f${pad(i + 1)}.webp`
const tc = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/**
 * Produção: quadros do vídeo institucional desenhados num canvas e "tocados" pelo scroll.
 * A seção só existe quando scripts/video-frames.mjs gerou os quadros.
 */
export function Producao() {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const imgs = useRef<(HTMLImageElement | null)[]>([])
  const current = useRef(0)
  const { open } = useUI()
  const N = frames.count

  // desenha o quadro mais próximo já carregado (cover, nítido em telas retina)
  const draw = (i: number) => {
    const c = canvas.current
    if (!c || !N) return
    current.current = i
    let img: HTMLImageElement | null = null
    for (let d = 0; d < N && !img; d++) {
      for (const k of [i - d, i + d]) {
        const cand = imgs.current[k]
        if (cand && cand.complete && cand.naturalWidth) {
          img = cand
          break
        }
      }
    }
    if (!img) return
    const ctx = c.getContext('2d')!
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = c.clientWidth * dpr
    const h = c.clientHeight * dpr
    if (c.width !== w || c.height !== h) {
      c.width = w
      c.height = h
    }
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight)
    const dw = img.naturalWidth * s
    const dh = img.naturalHeight * s
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
  }

  // carrega os quadros quando a seção se aproxima: primeiro 1 a cada 8, depois o resto
  useEffect(() => {
    if (!N || !root.current) return
    const dir: 'd' | 'm' = window.innerWidth < 768 ? 'm' : 'd'
    let started = false
    const load = (i: number) => {
      if (imgs.current[i]) return
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        if (Math.abs(i - current.current) <= 8) draw(current.current)
      }
      img.src = url(dir, i)
      imgs.current[i] = img
    }
    const io = new IntersectionObserver(
      (es) => {
        if (started || !es.some((e) => e.isIntersecting)) return
        started = true
        load(Math.round((N - 1) / 2))
        load(0)
        for (let i = 0; i < N; i += 8) load(i)
        const rest = () => {
          for (let i = 0; i < N; i++) load(i)
        }
        if ('requestIdleCallback' in window) requestIdleCallback(rest)
        else setTimeout(rest, 300)
      },
      { rootMargin: '150% 0px' },
    )
    io.observe(root.current)
    const onResize = () => draw(current.current)
    window.addEventListener('resize', onResize)
    return () => {
      io.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [N])

  useGSAP(
    () => {
      if (!N) return
      const q = gsap.utils.selector(root)
      const mm = gsap.matchMedia()
      const time = q('.prod2__tc')[0] as HTMLElement
      const fill = q('.prod2__fill')[0] as HTMLElement
      const span = (frames.end ?? 0) - (frames.start ?? 0)
      const show = (p: number) => {
        const i = Math.round(p * (N - 1))
        if (i !== current.current) draw(i)
        if (time) time.textContent = tc((frames.start ?? 0) + p * span)
        if (fill) fill.style.transform = `scaleX(${p})`
      }

      mm.add({ desktop: MQ.desktop, compact: MQ.compact }, () => {
        const stage = q('.prod2__stage')[0] as HTMLElement
        gsap.set(q('.prod2__title .mask > *'), { yPercent: 0 })
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=300%',
            pin: stage,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => show(self.progress),
            onRefresh: (self) => show(self.progress),
          },
        })
        pinRegistry.producao = { st: tl.scrollTrigger!, anchors: { producao: 0 } }
        // o título abre a sequência e sai para a imagem tomar a tela; a legenda fica
        tl.to(q('.prod2__title .mask > *'), { yPercent: -140, stagger: 0.01, duration: 0.08, ease: 'power2.in' }, 0.12)
          .fromTo(q('.prod2__shade'), { opacity: 1 }, { opacity: 0.35, duration: 0.12 }, 0.12)
          .to(q('.prod2__title .mask > *'), { yPercent: 0, stagger: 0.01, duration: 0.08, ease: 'power2.out' }, 0.88)
          .to(q('.prod2__shade'), { opacity: 1, duration: 0.1 }, 0.88)
        const unprime = prime(tl)
        return () => {
          unprime()
          delete pinRegistry.producao
        }
      })

      mm.add(MQ.reduced, () => {
        // sem scrub: um quadro do meio, estático
        const mid = Math.round((N - 1) / 2)
        const t = setInterval(() => {
          draw(mid)
          if (imgs.current[mid]?.complete) clearInterval(t)
        }, 200)
        return () => clearInterval(t)
      })

      // quadros que chegam depois de um refresh
      const onRefresh = () => draw(current.current)
      ScrollTrigger.addEventListener('refresh', onRefresh)
      return () => {
        ScrollTrigger.removeEventListener('refresh', onRefresh)
        mm.revert()
      }
    },
    { scope: root },
  )

  if (!N) return null

  return (
    <section id="producao" ref={root} className="producao" aria-labelledby="producao-title">
      <div className="prod2__stage">
        <canvas ref={canvas} className="prod2__canvas" role="img" aria-label="Quadros do vídeo institucional mostrando a produção da fábrica" />
        <div className="prod2__shade" aria-hidden="true" />
        <div className="prod2__title">
          <p className="mask">
            <span className="mono">Produção · {empresa.localizacao.cidade}</span>
          </p>
          <h2 id="producao-title" className="display">
            <span className="mask">
              <span>Por dentro</span>
            </span>
            <span className="mask">
              <span>da fábrica</span>
            </span>
          </h2>
        </div>
        <div className="prod2__bar">
          <span className="mono">Vídeo institucional · role para avançar</span>
          <span className="prod2__track" aria-hidden="true">
            <span className="prod2__fill" />
          </span>
          <span className="prod2__tc mono" aria-hidden="true">
            {tc(frames.start ?? 0)}
          </span>
          <button
            type="button"
            className="btn btn--ghost-light"
            onClick={(e) => open({ type: 'video', id: empresa.video.youtube_id, title: empresa.video.titulo }, e.currentTarget)}
          >
            <span className="btn__arrow" aria-hidden="true">▶</span> Assistir completo
          </button>
        </div>
      </div>
    </section>
  )
}
