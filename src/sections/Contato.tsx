import { useRef, useState, type FormEvent } from 'react'
import { Cutout } from '../components/Cutout'
import { CONTATO_MSG, contato, enderecoCurto, empresa, produtos, waLink, whatsappLabel } from '../content/tatu'
import { gsap, MQ, useGSAP } from '../motion/setup'
import './contato.css'

type Fields = { nome: string; contato: string; produto: string; mensagem: string }
type Errors = Partial<Record<keyof Fields, string>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE = /^[\d\s()+-]{10,}$/

function validate(f: Fields): Errors {
  const e: Errors = {}
  if (f.nome.trim().length < 2) e.nome = 'Informe seu nome.'
  const c = f.contato.trim()
  if (!c) e.contato = 'Informe um telefone ou e-mail.'
  else if (!EMAIL.test(c) && !(PHONE.test(c) && c.replace(/\D/g, '').length >= 10)) e.contato = 'Use um e-mail válido ou telefone com DDD.'
  if (!f.produto) e.produto = 'Escolha um produto.'
  if (f.mensagem.trim().length < 5) e.mensagem = 'Escreva uma mensagem curta.'
  return e
}

function compose(f: Fields) {
  return [
    `Olá, ${empresa.nome}! Gostaria de solicitar um orçamento.`,
    '',
    `Nome: ${f.nome.trim()}`,
    `Contato: ${f.contato.trim()}`,
    `Produto: ${f.produto}`,
    '',
    f.mensagem.trim(),
  ].join('\n')
}

export function Contato() {
  const root = useRef<HTMLElement>(null)
  const [f, setF] = useState<Fields>({ nome: '', contato: '', produto: '', mensagem: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({})
  const [sent, setSent] = useState(false)

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const mm = gsap.matchMedia()
      mm.add({ desktop: MQ.desktop, compact: MQ.compact }, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: q('.ct__title')[0], start: 'top 75%', once: true } })
        tl.from(q('.ct__title .mask > *'), { yPercent: 140, duration: 1.2, ease: 'expo.out', stagger: 0.06 })
          // a telha entra girando e pousa sobre "A TATU"
          .from(q('.ct__tile'), { rotate: -40, y: -200, opacity: 0, duration: 1.3, ease: 'expo.out' }, 0.35)
          .from(q('.ct__list > div, .ct__ctas'), { opacity: 0, y: 20, stagger: 0.06, duration: 1.1, ease: 'expo.out' }, 0.5)
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  const set = (k: keyof Fields) => (e: { target: { value: string } }) => {
    const next = { ...f, [k]: e.target.value }
    setF(next)
    if (touched[k]) setErrors(validate(next))
  }
  const blur = (k: keyof Fields) => () => {
    setTouched((t) => ({ ...t, [k]: true }))
    setErrors(validate(f))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(f)
    setErrors(errs)
    setTouched({ nome: true, contato: true, produto: true, mensagem: true })
    const first = Object.keys(errs)[0]
    if (first) {
      root.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    window.open(waLink(compose(f)), '_blank', 'noopener,noreferrer')
    setSent(true)
  }

  const mailto = `mailto:${contato.email ?? ''}?subject=${encodeURIComponent('Solicitação de orçamento')}&body=${encodeURIComponent(compose(f))}`
  const err = (k: keyof Fields) => (touched[k] ? errors[k] : undefined)

  return (
    <section id="contato" ref={root} className="contato studio" aria-labelledby="contato-title">
      <div className="wrap ct__wrap">
        <div className="ct__head">
          <h2 id="contato-title" className="ct__title display" aria-label="Fale com a Tatu">
            <span className="mask" aria-hidden="true">
              <span>Fale com</span>
            </span>
            <span className="mask ct__line2" aria-hidden="true">
              <span>a Tatu</span>
            </span>
          </h2>
          <div className="ct__tile" aria-hidden="true">
            <Cutout name="telha" sizes="260px" alt="" />
          </div>
        </div>

        <div className="ct__info">
          <dl className="ct__list">
            <div>
              <dt className="mono mono--steel">Fábrica</dt>
              <dd>
                {empresa.endereco_completo ?? enderecoCurto}
                {empresa.cep ? ` · CEP ${empresa.cep}` : <span className="ct__pending"> · CEP pendente no tatu-content.json</span>}
              </dd>
            </div>
            <div>
              <dt className="mono mono--steel">Telefone</dt>
              <dd>
                {contato.telefone ? (
                  <a href={`tel:+${contato.telefone.replace(/\D/g, '')}`}>{contato.telefone}</a>
                ) : (
                  <span className="ct__pending">Número fixo pendente no tatu-content.json</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="mono mono--steel">WhatsApp vendas</dt>
              <dd>
                <a href={waLink(CONTATO_MSG)} target="_blank" rel="noopener noreferrer">
                  {whatsappLabel}
                </a>
              </dd>
            </div>
            <div>
              <dt className="mono mono--steel">E-mail</dt>
              <dd>
                {contato.email ? <a href={`mailto:${contato.email}`}>{contato.email}</a> : <span className="ct__pending">Endereço pendente no tatu-content.json</span>}
              </dd>
            </div>
          </dl>
          <div className="ct__ctas btn-row">
            <a
              className="btn btn--primary"
              href="#orcamento"
              onClick={(e) => {
                e.preventDefault()
                root.current?.querySelector<HTMLElement>('[name="nome"]')?.focus()
              }}
            >
              Solicitar orçamento
            </a>
            <a className="btn btn--dark" href={waLink(CONTATO_MSG)} target="_blank" rel="noopener noreferrer">
              Falar no WhatsApp
            </a>
          </div>
        </div>

        <form id="orcamento" className="ct__form" noValidate onSubmit={submit} aria-labelledby="orcamento-title">
          <h3 id="orcamento-title" className="mono mono--accent">
            Solicitar orçamento
          </h3>
          <div className={`field ${err('nome') ? 'has-error' : ''}`}>
            <label htmlFor="f-nome">Nome</label>
            <input id="f-nome" name="nome" autoComplete="name" value={f.nome} onChange={set('nome')} onBlur={blur('nome')} aria-invalid={!!err('nome')} aria-describedby={err('nome') ? 'e-nome' : undefined} />
            {err('nome') && <p id="e-nome" className="field__error">{err('nome')}</p>}
          </div>
          <div className={`field ${err('contato') ? 'has-error' : ''}`}>
            <label htmlFor="f-contato">Telefone ou e-mail</label>
            <input id="f-contato" name="contato" autoComplete="email" inputMode="email" value={f.contato} onChange={set('contato')} onBlur={blur('contato')} aria-invalid={!!err('contato')} aria-describedby={err('contato') ? 'e-contato' : undefined} />
            {err('contato') && <p id="e-contato" className="field__error">{err('contato')}</p>}
          </div>
          <div className={`field ${err('produto') ? 'has-error' : ''}`}>
            <label htmlFor="f-produto">Produto</label>
            <select id="f-produto" name="produto" value={f.produto} onChange={set('produto')} onBlur={blur('produto')} aria-invalid={!!err('produto')} aria-describedby={err('produto') ? 'e-produto' : undefined}>
              <option value="">Selecione</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.nome}>
                  {p.nome}
                </option>
              ))}
            </select>
            {err('produto') && <p id="e-produto" className="field__error">{err('produto')}</p>}
          </div>
          <div className={`field field--full ${err('mensagem') ? 'has-error' : ''}`}>
            <label htmlFor="f-mensagem">Mensagem</label>
            <textarea id="f-mensagem" name="mensagem" rows={4} value={f.mensagem} onChange={set('mensagem')} onBlur={blur('mensagem')} aria-invalid={!!err('mensagem')} aria-describedby={err('mensagem') ? 'e-mensagem' : undefined} />
            {err('mensagem') && <p id="e-mensagem" className="field__error">{err('mensagem')}</p>}
          </div>
          <div className="field--full ct__submit">
            <button type="submit" className="btn btn--primary">
              Enviar pelo WhatsApp <span className="btn__arrow" aria-hidden="true">→</span>
            </button>
            <a className="btn btn--ghost" href={mailto}>
              Prefiro e-mail
            </a>
          </div>
          <p className="ct__note field--full" role="status">
            {sent ? 'Abrimos o WhatsApp com sua mensagem pronta. É só enviar.' : 'O envio abre o WhatsApp com a mensagem montada — nada é armazenado neste site.'}
          </p>
        </form>
      </div>
    </section>
  )
}
