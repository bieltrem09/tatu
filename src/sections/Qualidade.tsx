import { useRef } from 'react'
import { PendingPhoto, Picture } from '../components/Media'
import { useUI } from '../components/ui-store'
import { asset, empresa, qualidade } from '../content/tatu'
import { gsap, MQ, SplitText, useGSAP } from '../motion/setup'
import './qualidade.css'

// Leque: rotações finais entre −8° e +6°
const ROT = [-8, -5, -2.5, 0.5, 2, 3.5, 5, 6]

export function Qualidade() {
  const root = useRef<HTMLElement>(null)
  const { open } = useUI()

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const mm = gsap.matchMedia()
      mm.add({ desktop: MQ.desktop, compact: MQ.compact }, () => {
        gsap.from(q('.q__iso .mask > *'), {
          yPercent: 140,
          duration: 1.3,
          ease: 'expo.out',
          stagger: 0.06,
          scrollTrigger: { trigger: q('.q__iso')[0], start: 'top 80%', once: true },
        })
        SplitText.create(q('.q__text')[0], {
          type: 'lines',
          mask: 'lines',
          aria: 'none',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 140,
              duration: 1.1,
              ease: 'expo.out',
              stagger: 0.06,
              scrollTrigger: { trigger: q('.q__text')[0], start: 'top 85%', once: true },
            }),
        })
        gsap.fromTo(
          q('.q__doc'),
          { y: 80, rotate: 0, opacity: 0 },
          {
            y: 0,
            rotate: (i) => ROT[i % ROT.length],
            opacity: 1,
            duration: 1.2,
            ease: 'expo.out',
            stagger: 0.08,
            scrollTrigger: { trigger: q('.q__fan')[0], start: 'top 80%', once: true },
          },
        )
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section id="qualidade" ref={root} className="qualidade studio" aria-labelledby="qualidade-title">
      <div className="wrap q__wrap">
        <div className="q__head">
          <p className="mono mono--accent">Qualidade</p>
          <p className="q__text lede">{qualidade.texto}</p>
        </div>
        <h2 id="qualidade-title" className="q__iso display" aria-label={`${empresa.iso9001.norma} desde ${empresa.iso9001.ano}`}>
          <span className="mask" aria-hidden="true">
            <span>{empresa.iso9001.norma}</span>
          </span>
        </h2>
        <ul className="q__fan" aria-label="Documentos de qualidade">
          {qualidade.documentos.map((d, i) => {
            const title = d.titulo ?? `Documento ${String(i + 1).padStart(2, '0')}`
            return (
              <li key={i} className="q__doc" style={{ ['--r' as string]: `${ROT[i % ROT.length]}deg`, zIndex: i }}>
                <button type="button" className="q__doc-btn" onClick={(e) => open({ type: 'doc', index: i }, e.currentTarget)}>
                  {d.imagem && asset(d.imagem) ? (
                    <Picture name={d.imagem} sizes="200px" alt={title} />
                  ) : (
                    <span className="q__sheet" aria-hidden="true">
                      <span className="q__sheet-lines" />
                      <PendingPhoto label={String(i + 1).padStart(2, '0')} sub="pendente" className="q__sheet-pending" />
                    </span>
                  )}
                  <span className="sr-only">Abrir {title}</span>
                </button>
              </li>
            )
          })}
        </ul>
        <p className="q__hint mono mono--steel">Documentos oficiais · clique para ampliar</p>
      </div>
    </section>
  )
}
