import { useEffect, useState } from 'react'

let idle = false
const waiters = new Set<() => void>()
if (typeof window !== 'undefined') {
  const go = () => {
    idle = true
    waiters.forEach((f) => f())
    waiters.clear()
  }
  const later = () => ('requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 2500 }) : setTimeout(go, 1200))
  if (document.readyState === 'complete') later()
  else window.addEventListener('load', later, { once: true })
}

/** true depois do load + idle: imagens de CSS (máscaras da malha) não disputam com o LCP. */
export function useIdle() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (idle) setReady(true)
    else {
      const f = () => setReady(true)
      waiters.add(f)
      return () => void waiters.delete(f)
    }
  }, [])
  return ready
}
