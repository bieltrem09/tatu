import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'

/** Pré-renderização no build: o HTML do site sai pronto no index.html (LCP sem esperar JS). */
export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
