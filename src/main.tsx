import './styles/tokens.css'
import './styles/base.css'
import './styles/chrome.css'
// CSS das seções no bundle inicial: o HTML pré-renderizado pinta já com o layout final (CLS)
import './sections/abertura.css'
import './sections/historia.css'
import './sections/produtos.css'
import './sections/obra.css'
import './sections/fabrica.css'
import './sections/qualidade.css'
import './sections/contato.css'

const el = document.getElementById('root')!
const start = () => import('./boot').then((m) => m.boot(el))

// O HTML já vem pronto: deixa a peça do hero (LCP) pintar antes de avaliar o JS pesado.
const hero = el.querySelector<HTMLImageElement>('.ab__piece img')
if (hero) {
  const ready = hero.complete ? Promise.resolve() : new Promise((r) => hero.addEventListener('load', r, { once: true }))
  Promise.race([ready.then(() => hero.decode().catch(() => {})), new Promise((r) => setTimeout(r, 1800))]).then(() =>
    requestAnimationFrame(() => setTimeout(start, 0)),
  )
} else {
  start()
}
