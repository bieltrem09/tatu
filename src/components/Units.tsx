/** Mantém unidades (m², /dia…) em minúsculas dentro de títulos em caixa alta. */
const UNIT = /(m²\/dia|m²|metros\/dia|blocos\/dia|\/dia)/g

export function Units({ text }: { text: string }) {
  const parts = text.split(UNIT)
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <span key={i} className="unit">
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  )
}
