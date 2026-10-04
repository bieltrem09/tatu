import { useRef, useState } from 'react'
import { Cutout } from '../components/Cutout'
import { SpecBox } from '../components/SpecBox'
import { useUI } from '../components/ui-store'
import { onAnchorClick } from '../components/Nav'
import { asset, produtos, sequencia, type Produto } from '../content/tatu'
import { gsap, MQ, pinRegistry, prime, useGSAP, willChangeDuring } from '../motion/setup'
import { offsetWithin } from '../motion/util'
import './produtos.css'

const pad = (n: number) => String(n).padStart(2, '0')
const TOTAL = sequencia.length
// Intervalos: produtos ocupam 0–.80; "Linha completa" os últimos 20%.
const HOLD = 0.35

function TelhaCores({ p, onPick, active }: { p: Produto; onPick: (name: string) => void; active: string }) {
  if (!p.cores) return null
  return (
    <div className="prod__cores">
      <p className="mono mono--steel">Cores</p>
      <ul>
        {p.cores.map((c) => {
          const has = !!asset(c.recorte)
          return (
            <li key={c.nome}>
              {has ? (
                <button
                  type="button"
                  className={`prod__cor ${active === c.recorte ? 'is-active' : ''}`}
                  style={{ ['--c' as string]: c.amostra }}
                  aria-pressed={active === c.recorte}
                  onClick={() => onPick(c.recorte)}
                >
                  <span className="sr-only">{c.nome}</span>
                </button>
              ) : (
                <span className="prod__cor prod__cor--static" style={{ ['--c' as string]: c.amostra }} title={`${c.nome} — PNG oficial pendente`}>
                  <span className="sr-only">{c.nome}</span>
                </span>
              )}
              <span className="prod__cor-name mono">{c.nome}</span>
            </li>
          )
        })}
      </ul>
      <p className="prod__aviso">{p.aviso_cores}</p>
    </div>
  )
}

export function Produtos() {
  const root = useRef<HTMLElement>(null)
  const { open } = useUI()
  const [cor, setCor] = useState('telha')

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const mm = gsap.matchMedia()

      mm.add({ desktop: MQ.desktop, compact: MQ.compact }, (ctx) => {
        const { desktop } = ctx.conditions as { desktop: boolean; compact: boolean }
        const stage = q('.prod__stage')[0] as HTMLElement
        const pinbox = q('.prod__pinbox')[0] as HTMLElement
        const slides = q('.prod__slide') as HTMLElement[]
        const parts = slides.map((s) => ({
          piece: s.querySelector<HTMLElement>('.prod__piece-in')!,
          img: s.querySelector<HTMLElement>('.prod__piece .cutout__img, .prod__piece .pending-product'),
          mesh: s.querySelector<HTMLElement>('.prod__piece .mesh'),
          word: s.querySelector<HTMLElement>('.prod__word')!,
          info: [...s.querySelectorAll<HTMLElement>('.prod__info .mask > *')],
          infoBox: s.querySelector<HTMLElement>('.prod__info')!,
          spec: s.querySelector<HTMLElement>('.prod__specs')!,
          rows: [...s.querySelectorAll<HTMLElement>('.prod__specs [data-spec-row], .prod__cores')],
        }))
        const segs = q('.prod__seg-fill') as HTMLElement[]
        const H = () => window.innerHeight
        const rot = desktop ? 1 : 0 // compacto: sem rotação
        const Y0 = desktop ? 250 : 70 // palavra gigante: posição de entrada e de saída lenta
        const Y1 = desktop ? 190 : 40

        // Estado inicial: só o produto 01 visível
        parts.forEach((p, i) => {
          gsap.set(p.word, { yPercent: -50, y: i === 0 ? Y0 : () => H() })
          if (i > 0) {
            gsap.set(p.piece, { opacity: 0, rotate: 12 * rot, scale: 0.82, y: 60 })
            gsap.set(p.info, { yPercent: 140 })
            gsap.set(p.rows, { opacity: 0, y: 14 })
            gsap.set([p.infoBox, p.spec], { autoAlpha: 0 })
            if (p.mesh && p.img) {
              gsap.set(p.mesh, { opacity: 1 })
              gsap.set(p.img, { opacity: 0 })
            }
          }
        })

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: desktop ? '+=500%' : '+=300%',
            pin: desktop ? stage : pinbox,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            ...willChangeDuring(parts.flatMap((p) => [p.piece, p.word])),
          },
        })
        pinRegistry.produtos = { st: tl.scrollTrigger!, anchors: { produtos: 0.02 } }

        // Entrada do 01 (vindo da História, a peça já está no lugar)
        const INTRO = 0.03
        tl.fromTo(parts[0].word, { y: () => H() }, { y: Y0, duration: INTRO, ease: 'power2.out' }, 0)
          .from(parts[0].info, { yPercent: 140, stagger: 0.008, duration: 0.03 }, 0)
          .from(parts[0].rows, { opacity: 0, y: 14, stagger: 0.008, duration: 0.03 }, 0.01)
          .from(q('.prod__progress'), { opacity: 0, duration: 0.03 }, 0)

        const lastEnd = desktop ? 0.8 : 1
        const span = lastEnd / TOTAL
        parts.forEach((p, i) => {
          const a = i * span
          const hold = span * HOLD
          const sw = span - hold
          // parado: palavra sobe devagar atrás da peça
          const intro = i === 0 ? INTRO : 0
          tl.to(p.word, { y: Y1, duration: hold - intro }, a + intro)
          if (segs[i]) tl.fromTo(segs[i], { scaleX: 0 }, { scaleX: 1, duration: span }, a)
          const n = parts[i + 1]
          if (!n) return
          const t0 = a + hold
          const half = sw / 2
          // troca, 1ª metade: a atual vira wireframe e sai
          tl.to(p.piece, { rotate: -14 * rot, scale: 0.82, y: -50, duration: half, ease: 'power2.inOut' }, t0)
          if (p.mesh) tl.to(p.mesh, { opacity: 1, duration: half * 0.5 }, t0)
          if (p.img) tl.to(p.img, { opacity: 0, duration: half * 0.6 }, t0 + half * 0.3)
          tl.to(p.piece, { opacity: 0, duration: half * 0.3 }, t0 + half * 0.7)
          // palavra atual sai pelo topo; a próxima vem de baixo
          tl.to(p.word, { y: () => -H() * 0.9, duration: sw, ease: 'power2.in' }, t0)
          tl.to(n.word, { y: Y0, duration: sw, ease: 'power2.out' }, t0 + half * 0.4)
          // índice, nome e caixa trocam por máscara
          tl.to(p.info, { yPercent: -140, stagger: 0.004, duration: half * 0.7, ease: 'power2.in' }, t0)
            .to(p.rows, { opacity: 0, y: -12, stagger: 0.15 * half * 0.3, duration: half * 0.5 }, t0)
            .set([p.infoBox, p.spec], { autoAlpha: 0 }, t0 + half)
            .set([n.infoBox, n.spec], { autoAlpha: 1 }, t0 + half)
            .to(n.info, { yPercent: 0, stagger: 0.004, duration: half * 0.8, ease: 'power2.out' }, t0 + half)
            .to(n.rows, { opacity: 1, y: 0, stagger: 0.15 * half * 0.3, duration: half * 0.5 }, t0 + half * 1.1)
          // troca, 2ª metade: a próxima entra como malha e se materializa
          tl.to(n.piece, { opacity: 1, rotate: 0, scale: 1, y: 0, duration: half, ease: 'power2.out' }, t0 + half)
          if (n.mesh && n.img) {
            tl.to(n.mesh, { opacity: 0, duration: half * 0.5 }, t0 + half * 1.5)
              .to(n.img, { opacity: 1, duration: half * 0.5 }, t0 + half * 1.4)
          }
        })

        if (desktop) {
          // ---------- Linha completa: a telha encolhe e pousa na 7ª posição ----------
          const last = parts[TOTAL - 1]
          const slotImgs = q('.prod__line-piece') as HTMLElement[]
          const telhaIdx = produtos.findIndex((p) => p.id === 'telhas')
          const others = slotImgs.filter((_, i) => i !== telhaIdx)
          const fit = () => {
            const s = offsetWithin(last.piece, stage)
            const t = offsetWithin(slotImgs[telhaIdx], stage)
            const scale = Math.min(t.w / s.w, t.h / s.h)
            return { dx: t.x + t.w / 2 - (s.x + s.w / 2), dy: t.y + t.h / 2 - (s.y + s.h / 2), scale }
          }
          gsap.set(q('.prod__line'), { autoAlpha: 0 })
          gsap.set(slotImgs[telhaIdx], { opacity: 0 })
          gsap.set(others, { y: 260, opacity: 0 })
          gsap.set(q('.prod__line-label'), { opacity: 0, y: 10 })
          gsap.set(q('.prod__line-title .mask > *'), { yPercent: 140 })
          tl.to(q('.prod__word, .prod__info, .prod__specs, .prod__progress'), { opacity: 0, duration: 0.04 }, 0.8)
            .to(last.piece, { x: () => fit().dx, y: () => fit().dy, scale: () => fit().scale, duration: 0.1, ease: 'power3.inOut' }, 0.8)
            .to(q('.prod__line'), { autoAlpha: 1, duration: 0.01 }, 0.8)
            .to(others, { y: 0, opacity: 1, stagger: 0.008, duration: 0.08, ease: 'power3.out' }, 0.84)
            .to(q('.prod__line-label'), { opacity: 1, y: 0, stagger: 0.006, duration: 0.04 }, 0.9)
            .to(q('.prod__line-title .mask > *'), { yPercent: 0, duration: 0.05, ease: 'power2.out' }, 0.86)
            .to(slotImgs[telhaIdx], { opacity: 1, duration: 0.01 }, 0.9)
            .to(last.piece, { opacity: 0, duration: 0.01 }, 0.9)
        }
        const unprime = prime(tl)

        return () => {
          unprime()
          delete pinRegistry.produtos
        }
      })

      mm.add(MQ.compact, () => {
        gsap.from(q('.prod__line-item'), {
          y: 80,
          opacity: 0,
          stagger: 0.05,
          duration: 1.1,
          ease: 'expo.out',
          scrollTrigger: { trigger: q('.prod__line')[0], start: 'top 80%', once: true },
        })
      })

      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section id="produtos" ref={root} className="produtos" aria-labelledby="produtos-title">
      <div className="prod__stage studio">
        <div className="prod__pinbox">
          <h2 id="produtos-title" className="prod__eyebrow mono mono--accent">
            Produtos
          </h2>
          <div className="prod__slides">
            {sequencia.map((p, i) => (
              <article className="prod__slide" key={p.id} aria-labelledby={`prod-${p.id}`}>
                <span className="prod__word display" aria-hidden="true">
                  {p.palavra}
                </span>
                <div className="prod__piece">
                  <div className="prod__piece-in piece-box">
                    {p.id === 'telhas' && cor !== 'telha' ? (
                      <Cutout key={cor} name={cor} sizes="(min-width: 1024px) 520px, 70vw" alt={`${p.nome} — cor`} mesh />
                    ) : (
                      <Cutout name={p.recorte} sizes="(min-width: 1024px) 520px, 70vw" alt={p.nome} mesh />
                    )}
                  </div>
                </div>
                <div className="prod__info">
                  <p className="mask">
                    <span className="mono mono--steel">
                      {pad(i + 1)} / {pad(TOTAL)}
                    </span>
                  </p>
                  <h3 id={`prod-${p.id}`} className="mask">
                    <span className="display prod__name">{p.nome}</span>
                  </h3>
                  <p className="mask">
                    <span className={`prod__desc ${p.descricao_curta ? '' : 'is-pending'}`}>
                      {p.descricao_curta ?? 'Descrição oficial pendente no tatu-content.json.'}
                    </span>
                  </p>
                  <div className="mask">
                    <div className="btn-row">
                      <a className="btn btn--primary" href="#orcamento" onClick={(e) => onAnchorClick(e, 'orcamento')}>
                        Solicitar orçamento
                      </a>
                      <a className="btn btn--ghost" href="#obras" onClick={(e) => onAnchorClick(e, 'obras')}>
                        Ver na obra
                      </a>
                    </div>
                  </div>
                </div>
                <div className="prod__specs">
                  <SpecBox title="Especificações" aside={pad(i + 1)} rows={p.dados_para_caixa} minRows={p.dados_para_caixa.length ? 0 : 1} />
                  {p.cores && <TelhaCores p={p} active={cor} onPick={setCor} />}
                </div>
              </article>
            ))}
          </div>

          <ol className="prod__progress" aria-hidden="true">
            {sequencia.map((p) => (
              <li key={p.id}>
                <span className="prod__seg">
                  <span className="prod__seg-fill" />
                </span>
                <span className="mono">{p.nome}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="prod__line">
          <h3 className="prod__line-title display">
            <span className="mask">
              <span>Linha completa</span>
            </span>
          </h3>
          <ul className="prod__line-row">
            {produtos.map((p, i) => (
              <li key={p.id} className="prod__line-item">
                <button type="button" className="prod__line-btn" onClick={(e) => open({ type: 'produto', id: p.id }, e.currentTarget)}>
                  <span className="prod__line-piece">
                    <Cutout name={p.recorte} sizes="200px" alt="" floor={false} pendingLabel="em produção" />
                  </span>
                  <span className="prod__line-label">
                    <span className="mono mono--accent">{pad(i + 1)}</span>
                    <span className="prod__line-name">{p.nome}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <span className="prod__line-floor" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
