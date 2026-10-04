import { Logo, onAnchorClick } from '../components/Nav'
import { CONTATO_MSG, contato, enderecoCurto, empresa, waLink, whatsappLabel } from '../content/tatu'

type L = { label: string; anchor?: string; href?: string | null }

const LINKS: L[] = [
  { label: 'Empresa', anchor: 'empresa' },
  { label: 'Linha do tempo', anchor: 'historia' },
  { label: 'Estrutura', anchor: 'fabrica' },
  { label: 'Qualidade', anchor: 'qualidade' },
  { label: 'Vendas', anchor: 'orcamento' },
  { label: 'Downloads', href: contato.links.downloads },
  { label: 'Loja virtual', href: contato.links.loja_virtual },
]

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__grid">
        <div className="footer__brand">
          <Logo light />
          <p className="footer__addr">
            {empresa.endereco_completo ?? enderecoCurto}
            {empresa.cep && ` · CEP ${empresa.cep}`}
          </p>
          <p>
            <a href={waLink(CONTATO_MSG)} target="_blank" rel="noopener noreferrer">
              WhatsApp {whatsappLabel}
            </a>
          </p>
        </div>

        <nav className="footer__nav" aria-label="Rodapé">
          <p className="mono">Navegação</p>
          <ul>
            {LINKS.map((l) => (
              <li key={l.label}>
                {l.anchor ? (
                  <a href={`#${l.anchor}`} onClick={(e) => onAnchorClick(e, l.anchor!)}>
                    {l.label}
                  </a>
                ) : l.href ? (
                  <a href={l.href} target="_blank" rel="noopener noreferrer">
                    {l.label}
                  </a>
                ) : (
                  <span className="footer__pending" title="Link oficial pendente no tatu-content.json">
                    {l.label} <span className="mono">· link pendente</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer__col">
          <p className="mono">Redes sociais</p>
          {contato.redes.length ? (
            <ul>
              {contato.redes.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer">
                    {r.nome}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="footer__pending">Perfis oficiais pendentes no tatu-content.json</p>
          )}
          <p className="mono" style={{ marginTop: 24 }}>
            Políticas
          </p>
          {contato.links.politicas_pdf.length ? (
            <ul>
              {contato.links.politicas_pdf.map((p) => (
                <li key={p.url}>
                  <a href={p.url} target="_blank" rel="noopener noreferrer">
                    {p.titulo} (PDF)
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="footer__pending">PDFs oficiais pendentes no tatu-content.json</p>
          )}
        </div>
      </div>
      <div className="wrap footer__base">
        <span className="mono" suppressHydrationWarning>
          © {new Date().getFullYear()} {empresa.nome}
        </span>
        <span className="mono">
          {empresa.iso9001.norma} · desde {empresa.inicio}
        </span>
      </div>
    </footer>
  )
}
