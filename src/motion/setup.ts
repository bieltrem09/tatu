import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

export { gsap, ScrollTrigger, SplitText, useGSAP }

export const MQ = {
  desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
  compact: '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
} as const

export type MotionContext = { desktop: boolean; compact: boolean; reduced: boolean }

export const EASE = {
  enter: 'expo.out',
  swap: 'power3.inOut',
  hover: 'power2.out',
} as const

let lenis: Lenis | null = null
export const getLenis = () => lenis

/** Scroll suave sincronizado com ScrollTrigger. Desligado com prefers-reduced-motion. */
export function startLenis() {
  const reduce = window.matchMedia(MQ.reduced)
  const tick = (time: number) => lenis?.raf(time * 1000)
  const on = () => {
    if (lenis) return
    lenis = new Lenis({ lerp: 0.11, smoothWheel: true, anchors: false })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
  }
  const off = () => {
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
  const apply = () => (reduce.matches ? off() : on())
  apply()
  reduce.addEventListener('change', apply)
  return () => {
    reduce.removeEventListener('change', apply)
    off()
  }
}

/** Rola até um seletor/elemento respeitando Lenis e reduced-motion. */
export function scrollToTarget(target: string | HTMLElement | number, offset = 0) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (el == null) return
  if (lenis) {
    lenis.scrollTo(el as HTMLElement | number, { offset, duration: 1.4 })
  } else {
    const y = typeof el === 'number' ? el : el.getBoundingClientRect().top + window.scrollY + offset
    window.scrollTo({ top: y, behavior: window.matchMedia(MQ.reduced).matches ? 'auto' : 'smooth' })
  }
}

/** Pins da página: se a âncora está dentro de um pin, rola até o início do pin + fração. */
export function scrollToPinProgress(trigger: ScrollTrigger | undefined, progress: number) {
  if (!trigger) return
  const y = trigger.start + (trigger.end - trigger.start) * progress
  scrollToTarget(y)
}

/** will-change só durante pins. */
export function willChangeDuring(els: (Element | null)[], value = 'transform, opacity') {
  const list = els.filter(Boolean) as HTMLElement[]
  return {
    onToggle(self: ScrollTrigger) {
      list.forEach((el) => (el.style.willChange = self.isActive ? value : ''))
    },
  }
}

/** Interpola valor por faixa de progresso [a,b] → 0..1 (clamp). */
export const seg = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)))

/** Registro dos pins por id de seção, para a navegação por âncora funcionar dentro dos pins. */
export const pinRegistry: Record<string, { st: ScrollTrigger; anchors?: Record<string, number> }> = {}

/** Navega até uma âncora: se ela vive dentro de um pin ativo, vai até o progresso certo. */
export function goToAnchor(id: string) {
  for (const key in pinRegistry) {
    const entry = pinRegistry[key]
    const p = entry.anchors?.[id]
    if (p != null && entry.st.isActive !== undefined && entry.st.pin) {
      scrollToPinProgress(entry.st, p)
      return
    }
  }
  scrollToTarget(`#${id}`)
}

/**
 * Renderiza a timeline no fim e volta ao progresso atual (sem callbacks): todo tween
 * grava seus valores iniciais e todo fromTo/from aplica o estado "from". O refresh do
 * ScrollTrigger reverte as timelines, então repetimos isso a cada refresh.
 */
const primed = new Set<gsap.core.Timeline>()
const reprime = (tl: gsap.core.Timeline) => {
  const p = tl.progress()
  tl.progress(1, true).progress(p, true)
}
ScrollTrigger.addEventListener('refresh', () => primed.forEach(reprime))

export function prime(tl: gsap.core.Timeline) {
  reprime(tl)
  primed.add(tl)
  return () => primed.delete(tl)
}
