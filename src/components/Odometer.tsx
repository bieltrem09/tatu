import { forwardRef, useImperativeHandle, useRef } from 'react'

export type OdometerHandle = { set: (value: number) => void }

const CELLS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]

/**
 * Posição contínua de cada coluna: um dígito só gira enquanto todos os de menor
 * ordem estão passando de 9 para 0 (lógica de odômetro mecânico).
 */
export function columnPositions(value: number, digits: number) {
  const whole = Math.floor(value)
  const frac = value - whole
  const out: number[] = []
  for (let k = 0; k < digits; k++) {
    const d = Math.floor(whole / 10 ** k) % 10
    // gira junto se todos os dígitos abaixo são 9
    let rolling = true
    for (let j = 0; j < k; j++) if (Math.floor(whole / 10 ** j) % 10 !== 9) rolling = false
    out.unshift(d + (rolling ? frac : 0))
  }
  return out
}

type Props = { value: number; digits?: number; className?: string }

/** Contador mecânico. Decorativo (aria-hidden): o valor real vai em texto oculto ao lado. */
export const Odometer = forwardRef<OdometerHandle, Props>(function Odometer({ value, digits = 4, className }, ref) {
  const strips = useRef<(HTMLSpanElement | null)[]>([])
  const initial = columnPositions(value, digits)

  useImperativeHandle(ref, () => ({
    set(v: number) {
      columnPositions(v, digits).forEach((pos, i) => {
        const s = strips.current[i]
        if (s) s.style.transform = `translate3d(0, ${(-pos / CELLS.length) * 100}%, 0)`
      })
    },
  }))

  return (
    <span className={`odo ${className ?? ''}`} aria-hidden="true">
      {initial.map((pos, i) => (
        <span className="odo__col" key={i}>
          <span
            className="odo__strip"
            ref={(el) => {
              strips.current[i] = el
            }}
            style={{ transform: `translate3d(0, ${(-pos / CELLS.length) * 100}%, 0)` }}
          >
            {CELLS.map((c, j) => (
              <span className="odo__cell" key={j}>
                {c}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  )
})
