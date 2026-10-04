import { useRef } from 'react'
import { Odometer, type OdometerHandle } from '../components/Odometer'
import { PendingPhoto, Picture } from '../components/Media'
import { Cutout } from '../components/Cutout'
import { SpecBox } from '../components/SpecBox'
import { Units } from '../components/Units'
import { asset, capitulos, empresa, marcos, type Marco, type Spec } from '../content/tatu'
import { gsap, MQ, pinRegistry, prime, useGSAP, willChangeDuring } from '../motion/setup'
import './historia.css'

const FIRST = marcos[0].ano
const LAST = marcos[marcos.length - 1].ano
const N = marcos.length

// Caixa de cada capítulo: só números que existem no JSON (ver briefing 5.2)
const CHAPTER_SPECS: Record<string, Spec[]> = {
  I: [{ rotulo: 'Início', valor: String(empresa.inicio), nota: 'Pré-moldados de concreto' }],
  II: [],
  III: [
    { rotulo: 'Vigotas · 1993', valor: '+500%', nota: 'capacidade de vigotas' },
    { rotulo: 'Blocos · 1998 e 2000', valor: '+40% ×2', nota: 'capacidade de blocos' },
  ],
  IV: [
    { rotulo: '2009', valor: '2.000 m²/dia', nota: 'capacidade' },
    { rotulo: '2011', valor: '150.000', nota: 'blocos/dia ou 9.000 m² pisos/dia' },
  ],
}

// Rotação final de cada "foto impressa" (determinística, entre −4° e 6°)
const settle = (i: number) => [-3.5, 4.5, -1.5, 5.5, -4, 2.5, 0.5, -2.5][i % 8]
const entry = (i: number) => (i % 2 ? 15 : -15)

const titulo = (m: Marco) => m.titulo ?? `Acervo ${m.ano}`
const texto = (m: Marco) => m.texto ?? 'Descrição oficial pendente no tatu-content.json.'

function Photo({ m, i }: { m: Marco; i: number }) {
  const label = m.selo ? `selo oficial · ${empresa.anos_de_historia.valor} anos` : `foto oficial · ${m.ano}`
  return (
    <figure className="hist__photo" data-photo={i} style={{ ['--r' as string]: `${settle(i)}deg` }}>
      {m.foto && asset(m.foto) ? (
        <Picture name={m.foto} sizes="320px" alt={`${titulo(m)} — ${m.ano}`} />
      ) : (
        <PendingPhoto label={label} sub="aguardando arquivo" className="hist__photo-pending" />
      )}
      <span className="hist__shade" aria-hidden="true" />
    </figure>
  )
}

export function Historia() {
  const root = useRef<HTMLElement>(null)
  const odo = useRef<OdometerHandle>(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const mm = gsap.matchMedia()

      mm.add(MQ.desktop, () => {
        const stage = q('.hist__stage')[0] as HTMLElement
        const items = q('.hist__item') as HTMLElement[]
        const photos = q('.hist__item .hist__photo') as HTMLElement[]
        const photoIdx = photos.map((p) => Number(p.closest<HTMLElement>('.hist__item')!.dataset.index))
        const chapters = q('.hist__chapbox') as HTMLElement[]
        const fill = q('.hist__fill')[0]
        const ticks = q('.hist__tick') as HTMLElement[]

        const START = 0.04
        const END = 0.84
        let current = -1
        let chapter = ''
        let shown = 0

        gsap.set(photos, { opacity: 0, y: -260, x: (i) => (i % 2 ? 160 : -160), rotate: (i) => entry(i), scale: 1.1 })
        gsap.set(items.map((it) => it.querySelector('.hist__text')), { autoAlpha: 0 })
        gsap.set(chapters, { autoAlpha: 0 })

        const showItem = (i: number, dir: number) => {
          if (i === current) return
          const prev = items[current]?.querySelector<HTMLElement>('.hist__text')
          const next = items[i]?.querySelector<HTMLElement>('.hist__text')
          if (prev) {
            gsap.to(prev.querySelectorAll('.mask > *'), { yPercent: dir > 0 ? -140 : 140, duration: 0.5, ease: 'power3.inOut', stagger: 0.03, overwrite: 'auto' })
            gsap.to(prev, { autoAlpha: 0, duration: 0.01, delay: 0.5, overwrite: 'auto' })
          }
          if (next) {
            gsap.set(next, { autoAlpha: 1, overwrite: 'auto' })
            gsap.fromTo(next.querySelectorAll('.mask > *'), { yPercent: dir > 0 ? 140 : -140 }, { yPercent: 0, duration: 0.6, ease: 'power3.inOut', stagger: 0.04, delay: 0.1, overwrite: 'auto' })
          }
          ticks.forEach((t, k) => t.classList.toggle('is-past', k <= i))
          current = i

          const ch = marcos[i].capitulo
          if (ch !== chapter) {
            const out = chapters.find((c) => c.dataset.chapter === chapter)
            const inn = chapters.find((c) => c.dataset.chapter === ch)
            if (out) gsap.to(out, { autoAlpha: 0, y: dir > 0 ? -20 : 20, duration: 0.35, ease: 'power2.in', overwrite: true })
            if (inn) {
              gsap.fromTo(inn, { autoAlpha: 0, y: dir > 0 ? 24 : -24 }, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.2, ease: 'power3.out', overwrite: true })
              const rows = inn.querySelectorAll('[data-spec-row]')
              if (rows.length) gsap.fromTo(rows, { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: 0.15, delay: 0.3, duration: 0.45, ease: 'power3.out' })
            }
            chapter = ch
          }

          // Cópias impressas: cada marco com foto joga uma nova na mesa
          const target = photoIdx.filter((pi) => pi <= i).length
          if (target !== shown) {
            photos.forEach((p, k) => {
              if (k < target && k >= shown) {
                gsap.to(p, { opacity: 1, x: 0, y: 0, rotate: settle(k), scale: 1, duration: 0.9, ease: 'expo.out', overwrite: true })
                gsap.fromTo(p, { '--shadow': 0 }, { '--shadow': 1, duration: 0.9, ease: 'power2.out' })
              } else if (k >= target && k < shown) {
                gsap.to(p, { opacity: 0, y: -260, x: k % 2 ? 160 : -160, rotate: entry(k), scale: 1.1, duration: 0.55, ease: 'power3.in', overwrite: true })
              }
            })
            shown = target
          }
          photos.forEach((p, k) => gsap.to(p.querySelector('.hist__shade'), { opacity: k < shown - 1 ? Math.min(0.35, (shown - 1 - k) * 0.12) : 0, duration: 0.5 }))
        }

        const ease = gsap.parseEase('power2.inOut')
        const update = (p: number) => {
          const t = Math.min(0.99999, Math.max(0, (p - START) / (END - START)))
          const idx = Math.min(N - 1, Math.floor(t * N))
          const local = t * N - idx
          let v = marcos[idx].ano
          if (idx < N - 1 && local > 0.5) v += (marcos[idx + 1].ano - marcos[idx].ano) * ease((local - 0.5) / 0.5)
          odo.current?.set(v)
          const dir = idx >= current ? 1 : -1
          showItem(idx, dir)
          finale(p < FINAL ? 0 : p < GONE ? 1 : 2)
        }

        // Final: as cópias saem da mesa; o selo (última foto) assenta sobre o "45"
        const FINAL = 0.85
        const GONE = 0.93
        let phase = 0
        const finale = (next: number) => {
          if (next === phase) return
          const selo = photos[photos.length - 1]
          if (next === 0) {
            photos.forEach((ph, k) =>
              gsap.to(ph, { opacity: k < shown ? 1 : 0, x: 0, y: k < shown ? 0 : -260, rotate: settle(k), scale: 1, duration: 0.6, ease: 'power3.out', overwrite: true }),
            )
          } else {
            photos.forEach((ph, k) => {
              if (ph === selo) return
              gsap.to(ph, { opacity: 0, y: window.innerHeight * 0.5, rotate: k % 2 ? 9 : -9, duration: 0.7, ease: 'power3.in', overwrite: true })
            })
            gsap.to(selo, {
              opacity: next === 2 ? 0 : 1,
              x: window.innerWidth * 0.06,
              y: -window.innerHeight * 0.1,
              rotate: 7,
              scale: next === 2 ? 0.6 : 0.95,
              duration: next === 2 ? 0.45 : 0.9,
              ease: next === 2 ? 'power2.in' : 'expo.out',
              overwrite: true,
            })
          }
          phase = next
        }

        // Timeline para o que é contínuo: entrada, régua, final "45 anos" e o bloco que sobe
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=550%',
            pin: stage,
            pinSpacing: false, // espaço reservado pelo .hist__runway
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => update(self.progress),
            onRefresh: (self) => update(self.progress),
            ...willChangeDuring(photos),
          },
        })
        pinRegistry.historia = { st: tl.scrollTrigger!, anchors: { historia: 0.05 } }

        tl.from(q('.hist__head, .hist__ruler'), { opacity: 0, y: 20, duration: 0.03 }, 0.005)
          .fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: END - START }, START)
          // Final (2022): tudo recua, o "45" cresce e o selo assenta (fotos: ver finale)
          .to(q('.hist__year'), { opacity: 0, scale: 0.92, duration: 0.025 }, 0.845)
          .to(q('.hist__text .mask, .hist__chapboxes, .hist__ruler, .hist__head'), { opacity: 0, duration: 0.025 }, 0.845)
          .fromTo(q('.hist__final-num'), { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.045, ease: 'power3.out' }, 0.86)
          .from(q('.hist__final-label .mask > *'), { yPercent: 140, duration: 0.03, stagger: 0.01 }, 0.885)
          .to(q('.hist__final'), { scale: 0.86, opacity: 0, duration: 0.035, ease: 'power2.in' }, 0.93)
          // O bloco reaparece subindo do rodapé: é o produto 01
          .fromTo(q('.hist__next'), { y: () => window.innerHeight * 0.75, opacity: 0 }, { y: 0, opacity: 1, duration: 0.06, ease: 'power2.out' }, 0.94)
          // último quadro: revela Produtos (mesma peça, mesma posição) por baixo
          .set(stage, { autoAlpha: 0 }, 0.998)
        const unprime = prime(tl)

        update(0)
        return () => {
          unprime()
          delete pinRegistry.historia
        }
      })

      mm.add(MQ.compact, () => {
        // Celular/tablet: carrossel horizontal de marcos; o ano gigante (odômetro) e a régua acompanham o card ativo
        const track = q('.hist__chapters')[0] as HTMLElement
        const items = q('.hist__item') as HTMLElement[]
        const chapEl = q('.hist__mchap')[0] as HTMLElement
        const countEl = q('.hist__mcount')[0] as HTMLElement
        const fill = q('.hist__fill')[0] as HTMLElement
        const ticks = q('.hist__tick') as HTMLElement[]
        const prev = q('.hist__mprev')[0] as HTMLButtonElement
        const next = q('.hist__mnext')[0] as HTMLButtonElement
        const state = { v: FIRST }
        let cur = -1
        odo.current?.set(FIRST)
        const activate = (i: number) => {
          if (i === cur) return
          cur = i
          const m = marcos[Number(items[i].dataset.index)]
          gsap.to(state, { v: m.ano, duration: 0.9, ease: 'power2.inOut', overwrite: true, onUpdate: () => odo.current?.set(state.v) })
          const cap = capitulos.find((c) => c.id === m.capitulo)
          chapEl.textContent = `Capítulo ${m.capitulo}${cap ? ` · ${cap.nome}` : ''}`
          countEl.textContent = `${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`
          gsap.to(fill, { scaleX: (m.ano - FIRST) / (LAST - FIRST || 1), duration: 0.6, ease: 'power2.out', overwrite: true })
          ticks.forEach((t, k) => t.classList.toggle('is-past', marcos[k].ano <= m.ano))
          items.forEach((it, k) => it.classList.toggle('is-active', k === i))
          prev.disabled = i === 0
          next.disabled = i === items.length - 1
        }
        const nearest = () => {
          const c = track.scrollLeft + track.clientWidth / 2
          let best = 0
          let d = Infinity
          items.forEach((it, k) => {
            const dd = Math.abs(it.offsetLeft + it.offsetWidth / 2 - c)
            if (dd < d) {
              d = dd
              best = k
            }
          })
          return best
        }
        let raf = 0
        const onScroll = () => {
          cancelAnimationFrame(raf)
          raf = requestAnimationFrame(() => activate(nearest()))
        }
        const goTo = (i: number) => {
          const it = items[Math.max(0, Math.min(items.length - 1, i))]
          track.scrollTo({ left: it.offsetLeft - (track.clientWidth - it.offsetWidth) / 2, behavior: 'smooth' })
        }
        const onPrev = () => goTo(cur - 1)
        const onNext = () => goTo(cur + 1)
        track.addEventListener('scroll', onScroll, { passive: true })
        prev.addEventListener('click', onPrev)
        next.addEventListener('click', onNext)
        activate(0)

        // entrada: ano, cards e régua sobem quando a seção chega
        gsap.from(q('.hist__year, .hist__mnav, .hist__ruler'), {
          immediateRender: false,
          opacity: 0,
          y: 30,
          stagger: 0.08,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: { trigger: root.current, start: 'top 75%', once: true },
        })
        // (o trilho inteiro entra; os cards em si ficam livres para a transição de ativo/inativo do CSS)
        gsap.from(track, { immediateRender: false, opacity: 0, x: 60, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: track, start: 'top 90%', once: true } })
        return () => {
          cancelAnimationFrame(raf)
          track.removeEventListener('scroll', onScroll)
          prev.removeEventListener('click', onPrev)
          next.removeEventListener('click', onNext)
          items.forEach((it) => it.classList.remove('is-active'))
        }
      })

      return () => mm.revert()
    },
    { scope: root },
  )

  const byChapter = capitulos.map((c) => ({ ...c, items: marcos.map((m, i) => ({ m, i })).filter(({ m }) => m.capitulo === c.id) }))
  const span = LAST - FIRST
  let photoCount = 0

  return (
    <div className="hist-wrap">
      <section id="historia" ref={root} className="historia" aria-labelledby="historia-title">
        <div className="hist__stage studio">
          <div className="hist__head">
            <h2 id="historia-title" className="mono mono--accent">
              Linha do tempo
            </h2>
            <span className="mono mono--steel">
              {FIRST}–{LAST}
            </span>
          </div>

          {/* Ano gigante (desktop) */}
          <div className="hist__year display" aria-hidden="true">
            <Odometer ref={odo} value={FIRST} />
          </div>

          <div className="hist__chapters">
            {byChapter.map((c) => (
              <div className="hist__chapter" key={c.id} data-chapter={c.id}>
                <div className="hist__chapter-head">
                  <span className="mono mono--steel">
                    Capítulo {c.id} · {c.nome}
                  </span>
                  {c.items.length > 0 && (
                    <span className="hist__sticky-odo display" data-start={c.items[0].m.ano} aria-hidden="true">
                      <Odometer value={c.items[0].m.ano} />
                    </span>
                  )}
                </div>
                <ol className="hist__list">
                  {c.items.map(({ m, i }) => {
                    const hasPhoto = m.tem_foto_oficial
                    const pi = hasPhoto ? photoCount++ : -1
                    return (
                      <li className="hist__item" key={m.ano} data-index={i} data-year={m.ano}>
                        {hasPhoto && <Photo m={m} i={pi} />}
                        <div className="hist__text">
                          <p className="mask">
                            <span className="mono mono--accent">
                              {m.ano} · {c.id} {c.nome}
                            </span>
                          </p>
                          <h3 className="mask">
                            <span className="display hist__title"><Units text={titulo(m)} /></span>
                          </h3>
                          <p className="mask">
                            <span className={`hist__body ${m.texto ? '' : 'is-pending'}`}>{texto(m)}</span>
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </div>
            ))}
          </div>

          {/* Celular: capítulo atual, contador e setas do carrossel */}
          <div className="hist__mnav">
            <span className="hist__mchap mono mono--steel" aria-live="polite" />
            <span className="hist__mcount mono" />
            <span className="hist__mbtns">
              <button type="button" className="hist__mprev" aria-label="Marco anterior">
                ←
              </button>
              <button type="button" className="hist__mnext" aria-label="Próximo marco">
                →
              </button>
            </span>
          </div>

          {/* Caixas por capítulo (desktop) */}
          <div className="hist__chapboxes" aria-hidden="true">
            {capitulos.map((c) => (
              <SpecBox
                key={c.id}
                className="hist__chapbox"
                title={`Capítulo ${c.id}`}
                aside={c.nome}
                rows={CHAPTER_SPECS[c.id] ?? []}
                rootRef={(el) => {
                  if (el) el.dataset.chapter = c.id
                }}
              />
            ))}
          </div>

          {/* Régua 1977–2022 */}
          <div className="hist__ruler" aria-hidden="true">
            <div className="hist__track">
              <span className="hist__fill" />
              {marcos.map((m) => (
                <span key={m.ano} className="hist__tick" style={{ left: `${((m.ano - FIRST) / span) * 100}%` }} />
              ))}
            </div>
            <div className="hist__chap-labels">
              {byChapter.map((c) => {
                const first = c.items[0]?.m.ano ?? FIRST
                return (
                  <span key={c.id} className="mono" style={{ left: `${((first - FIRST) / span) * 100}%` }}>
                    {c.id}
                    <span className="hist__chap-name">{c.nome}</span>
                  </span>
                )
              })}
            </div>
            <div className="hist__ends mono mono--steel">
              <span>{FIRST}</span>
              <span>{LAST}</span>
            </div>
          </div>

          {/* Final: 45 anos */}
          <div className="hist__final" aria-hidden="true">
            <span className="hist__final-num display">{empresa.anos_de_historia.valor}</span>
            <span className="hist__final-label">
              <span className="mask">
                <span className="display">anos de história</span>
              </span>
              <span className="mask">
                <span className="mono mono--steel">
                  {FIRST}–{empresa.anos_de_historia.ano}
                </span>
              </span>
            </span>
          </div>

          <div className="hist__next" aria-hidden="true">
            <Cutout name="blocos" sizes="(min-width: 1024px) 560px, 80vw" alt="" />
          </div>
        </div>
        <div className="hist__runway" aria-hidden="true" />
      </section>
    </div>
  )
}
