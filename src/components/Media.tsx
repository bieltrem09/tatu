import type { CSSProperties, Ref } from 'react'
import { asset, altDe, assetUrl } from '../content/tatu'

type PictureProps = {
  name: string
  sizes: string
  alt?: string
  priority?: boolean
  className?: string
  imgClassName?: string
  style?: CSSProperties
  imgRef?: Ref<HTMLImageElement>
  draggable?: boolean
}

/** <picture> AVIF + WebP em até 3 larguras, com width/height declarados (CLS). */
export function Picture({ name, sizes, alt, priority, className, imgClassName, style, imgRef }: PictureProps) {
  const a = asset(name)
  if (!a) return null
  const set = (ext: string) => a.widths.map((w) => `${import.meta.env.BASE_URL}img/kit/${name}-${w}.${ext} ${w}w`).join(', ')
  return (
    <picture className={className} style={style}>
      {/* recortes: só WebP (o alfa do AVIF com perdas deixa um halo claro no fundo) */}
      {a.kind === 'photo' && <source type="image/avif" srcSet={set('avif')} sizes={sizes} />}
      <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
      <img
        ref={imgRef}
        className={imgClassName}
        src={assetUrl(name, 800)}
        width={a.width}
        height={a.height}
        alt={alt ?? altDe(name)}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        draggable={false}
      />
    </picture>
  )
}

/** URL do recorte para usar como mask-image (mesma silhueta da peça). */
export const maskUrl = (name: string) => `url("${assetUrl(name, 800)}")`

export function maskStyle(name: string): CSSProperties {
  const u = maskUrl(name)
  return { WebkitMaskImage: u, maskImage: u }
}

/* ---------------- Pendências ---------------- */

type Shape = 'vigota' | 'laje' | 'piso' | 'drenante' | 'guia' | 'decorativo' | 'telha' | 'bloco'

const SHAPE_BY_RECORTE: Record<string, Shape> = {
  'vigotas-protendidas': 'vigota',
  'lajes-alveolares': 'laje',
  'pisos-intertravados': 'piso',
  'pisos-drenantes': 'drenante',
  guias: 'guia',
  'blocos-decorativos': 'decorativo',
  telha: 'telha',
  blocos: 'bloco',
}

/** Silhueta técnica em linha fina — usada quando não há recorte real no kit. */
export function PendingProduct({ recorte, label = 'foto em produção', className }: { recorte: string; label?: string; className?: string }) {
  const shape = SHAPE_BY_RECORTE[recorte] ?? 'bloco'
  return (
    <div className={`pending-product ${className ?? ''}`} role="img" aria-label={`Ilustração técnica — ${label}`}>
      <svg viewBox="0 0 400 300" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" aria-hidden="true">
        {SHAPES[shape]}
      </svg>
      <span className="pending-product__tag mono">{label}</span>
    </div>
  )
}

// Isométricas simples desenhadas à mão (linha fina, sem preenchimento)
const SHAPES: Record<Shape, React.ReactNode> = {
  vigota: (
    <g>
      {[0, 1, 2, 3].map((i) => {
        const x = 40 + i * 52
        const y = 210 - i * 10
        return (
          <g key={i}>
            <path d={`M${x} ${y} l20 0 l0 -14 l-6 0 l0 -14 l-8 0 l0 14 l-6 0 z`} />
            <path d={`M${x} ${y} l150 -120 M${x + 20} ${y} l150 -120 M${x + 14} ${y - 28} l150 -120 M${x + 6} ${y - 28} l150 -120`} opacity=".7" />
            <path d={`M${x + 150} ${y - 120} l20 0 l0 -14 l-6 0 l0 -14 l-8 0 l0 14 l-6 0 z`} opacity=".7" />
          </g>
        )
      })}
    </g>
  ),
  laje: (
    <g>
      <path d="M40 200 L300 200 L360 140 L100 140 Z" />
      <path d="M40 200 L40 240 L300 240 L300 200 M300 240 L360 180 L360 140" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <ellipse key={i} cx={66 + i * 44} cy={220} rx="14" ry="12" />
      ))}
    </g>
  ),
  piso: (
    <g>
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => {
          const x = 70 + c * 64 + r * 30
          const y = 220 - r * 40
          return <path key={`${r}-${c}`} d={`M${x} ${y} l56 0 l30 -34 l-56 0 z M${x} ${y} l0 12 l56 0 l0 -12 M${x + 56} ${y + 12} l30 -34 l0 -12`} />
        }),
      )}
    </g>
  ),
  drenante: (
    <g>
      <path d="M90 220 L270 220 L320 160 L140 160 Z M90 220 L90 244 L270 244 L270 220 M270 244 L320 184 L320 160" />
      {Array.from({ length: 18 }).map((_, i) => (
        <circle key={i} cx={130 + (i % 6) * 28 + Math.floor(i / 6) * 16} cy={208 - Math.floor(i / 6) * 18} r="3" />
      ))}
    </g>
  ),
  guia: (
    <g>
      <path d="M50 220 L290 220 L290 170 L270 140 L50 140 Z" />
      <path d="M50 140 L110 90 L330 90 L350 120 L350 170 L290 220 M270 140 L330 90 M290 170 L350 120" />
    </g>
  ),
  decorativo: (
    <g>
      <path d="M100 240 L260 240 L260 80 L100 80 Z M260 240 L310 200 L310 40 L150 40 L100 80 M260 80 L310 40" />
      <circle cx="180" cy="160" r="54" />
      <path d="M126 160 a54 54 0 0 1 108 0 M180 106 l0 108 M126 160 l108 0" opacity=".6" />
    </g>
  ),
  telha: (
    <g>
      <path d="M90 250 C110 200 150 200 170 250 C190 200 230 200 250 250 L300 60 C280 20 240 20 220 60 C200 20 160 20 140 60 Z" />
    </g>
  ),
  bloco: (
    <g>
      <path d="M80 220 L260 220 L320 170 L140 170 Z M80 220 L80 280 L260 280 L260 220 M260 280 L320 230 L320 170" />
      <path d="M120 207 L170 207 L190 190 L140 190 Z M200 207 L250 207 L270 190 L220 190 Z" />
    </g>
  ),
}

export function PendingPhoto({
  label,
  sub = 'aguardando foto oficial',
  dark,
  className,
  style,
}: {
  label: string
  sub?: string
  dark?: boolean
  className?: string
  style?: CSSProperties
}) {
  return (
    <div className={`pending-photo ${dark ? 'pending-photo--dark' : ''} ${className ?? ''}`} style={style} role="img" aria-label={`${label} — ${sub}`}>
      <svg className="pending-photo__cross" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0 L100 100 M100 0 L0 100" stroke="currentColor" strokeWidth=".15" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="pending-photo__label">
        <span className="mono">{label}</span>
        <span className="mono" style={{ opacity: 0.7 }}>{sub}</span>
      </span>
    </div>
  )
}
