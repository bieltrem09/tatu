import type { CSSProperties, Ref } from 'react'
import { asset } from '../content/tatu'
import { maskStyle, maskUrl, PendingProduct, Picture } from './Media'
import { useIdle } from './useIdle'

type Props = {
  name: string
  sizes: string
  alt?: string
  priority?: boolean
  className?: string
  style?: CSSProperties
  /** Malha de scan com a silhueta exata do PNG (técnica-chave 1). */
  mesh?: boolean
  /** Linha de varredura. */
  scan?: boolean
  floor?: boolean
  rootRef?: Ref<HTMLDivElement>
  pendingLabel?: string
}

/** Peça recortada: imagem + sombra macia + elipse de chão + malha opcional. */
export function Cutout({ name, sizes, alt, priority, className, style, mesh, scan, floor = true, rootRef, pendingLabel }: Props) {
  const a = asset(name)
  const idle = useIdle()
  if (!a) {
    return (
      <div ref={rootRef} className={`cutout cutout--pending ${className ?? ''}`} style={style} data-pending="">
        <PendingProduct recorte={name} label={pendingLabel} />
      </div>
    )
  }
  return (
    <div
      ref={rootRef}
      className={`cutout ${className ?? ''}`}
      style={{ aspectRatio: `${a.width} / ${a.height}`, ...style }}
    >
      {floor && <div className="cutout__floor" aria-hidden="true" />}
      <Picture className="cutout__img" name={name} sizes={sizes} alt={alt} priority={priority} />
      {mesh && <div className="cutout__ghost" style={idle ? { backgroundImage: maskUrl(name) } : undefined} aria-hidden="true" />}
      {mesh && <div className="mesh" style={idle ? maskStyle(name) : undefined} aria-hidden="true" />}
      {scan && <div className="scanline" aria-hidden="true" />}
    </div>
  )
}
