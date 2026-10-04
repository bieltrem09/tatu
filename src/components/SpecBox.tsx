import type { Ref } from 'react'
import type { Spec } from '../content/tatu'

type Props = {
  title?: string
  aside?: string
  rows: Spec[]
  className?: string
  rootRef?: Ref<HTMLDivElement>
  /** Completa com uma linha de pendência quando o JSON não traz dados suficientes. */
  minRows?: number
}

export function SpecBox({ title, aside, rows, className, rootRef, minRows = 0 }: Props) {
  const pending = Math.max(0, minRows - rows.length)
  return (
    <div ref={rootRef} className={`specbox ${className ?? ''}`}>
      {(title || aside) && (
        <div className="specbox__head">
          <span className="mono">{title}</span>
          {aside && <span className="mono mono--steel">{aside}</span>}
        </div>
      )}
      <dl>
        {rows.map((r, i) => (
          <div className="specbox__row" key={i} data-spec-row="">
            <dt className="mono mono--steel">{r.rotulo}</dt>
            <dd className="specbox__value">{r.valor}</dd>
            <dd className="specbox__note">{r.nota}</dd>
          </div>
        ))}
        {pending > 0 && (
          <div className="specbox__row specbox__row--pending" data-spec-row="">
            <dt className="mono mono--steel">Ficha técnica</dt>
            <dd className="specbox__value">—</dd>
            <dd className="specbox__note">Dados oficiais pendentes no tatu-content.json</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
