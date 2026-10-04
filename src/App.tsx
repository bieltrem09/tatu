import { useEffect } from 'react'
import { MobileBar, Nav } from './components/Nav'
import { Modals } from './components/Modals'
import { UIProvider } from './components/ui-store'
import { Abertura } from './sections/Abertura'
import { Historia } from './sections/Historia'
import { Produtos } from './sections/Produtos'
import { DaPecaAObra } from './sections/DaPecaAObra'
import { Fabrica } from './sections/Fabrica'
import { Qualidade } from './sections/Qualidade'
import { Contato } from './sections/Contato'
import { Footer } from './sections/Footer'
import { goToAnchor, ScrollTrigger, startLenis } from './motion/setup'
import { decodeImages } from './motion/util'

export default function App() {
  useEffect(() => {
    const stop = startLenis()
    let alive = true
    const refresh = () => {
      if (!alive) return
      ScrollTrigger.sort()
      ScrollTrigger.refresh()
    }
    // Recalcula os pins depois das fontes e das imagens dos pins
    document.fonts.ready.then(refresh)
    decodeImages(document.querySelector('main')!).then(() => {
      refresh()
      const id = location.hash.slice(1)
      if (id && document.getElementById(id)) requestAnimationFrame(() => goToAnchor(id))
    })
    return () => {
      alive = false
      stop()
    }
  }, [])

  return (
    <UIProvider>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Nav />
      <main id="conteudo">
        <Abertura />
        <Historia />
        <Produtos />
        <DaPecaAObra />
        <Fabrica />
        <Qualidade />
        <Contato />
      </main>
      <Footer />
      <MobileBar />
      <Modals />
    </UIProvider>
  )
}
