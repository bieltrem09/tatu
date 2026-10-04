import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.tsx'

export function boot(el: HTMLElement) {
  const app = (
    <StrictMode>
      <App />
    </StrictMode>
  )
  // Em produção o HTML vem pré-renderizado (scripts/prerender.mjs): hidrata em vez de recriar.
  if (el.firstElementChild) hydrateRoot(el, app)
  else createRoot(el).render(app)
}
