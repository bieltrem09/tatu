/** Offset de um elemento dentro de um ancestral, ignorando transforms (estável no refresh). */
export function offsetWithin(el: HTMLElement, ancestor: HTMLElement) {
  let x = 0
  let y = 0
  let node: HTMLElement | null = el
  while (node && node !== ancestor) {
    x += node.offsetLeft
    y += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight }
}

/** Decodifica as imagens de um container antes de medir os pins. */
export async function decodeImages(root: ParentNode) {
  // imagens lazy fora da tela não carregam até rolar: só esperamos as já pedidas
  const imgs = [...root.querySelectorAll('img')].filter((img) => img.loading !== 'lazy' || img.complete)
  const all = Promise.all(imgs.map((img) => img.decode().catch(() => {})))
  await Promise.race([all, new Promise((r) => setTimeout(r, 2500))])
}

export const vw = () => window.innerWidth
export const vh = () => window.innerHeight

/** Resolve uma cor CSS (inclusive var()) para rgb() que o GSAP interpola. */
export function cssColor(value: string) {
  const el = document.createElement('span')
  el.style.color = value
  document.body.appendChild(el)
  const c = getComputedStyle(el).color
  el.remove()
  return c
}
