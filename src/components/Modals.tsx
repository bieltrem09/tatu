import { useState } from 'react'
import { useUI } from './ui-store'
import { CloseButton, Dialog } from './Dialog'
import { asset, estrutura, produtoPorId, qualidade, waLink, vantagens, ORCAMENTO_MSG } from '../content/tatu'
import { Cutout } from './Cutout'
import { SpecBox } from './SpecBox'
import { PendingPhoto } from './Media'

export function Modals() {
  const { modal, close } = useUI()
  if (!modal) return null
  switch (modal.type) {
    case 'video':
      return <VideoModal id={modal.id} title={modal.title} onClose={close} />
    case 'produto':
      return <ProductDrawer id={modal.id} onClose={close} />
    case 'pontos':
      return <PontosPanel onClose={close} />
    case 'doc':
      return <DocLightbox start={modal.index} onClose={close} />
  }
}

/* -------- Vídeo: lite embed (miniatura até o clique; iframe nocookie só depois) -------- */
function VideoModal({ id, title, onClose }: { id: string; title: string; onClose: () => void }) {
  const [play, setPlay] = useState(false)
  return (
    <Dialog label={`Vídeo: ${title}`} onClose={onClose} variant="center" className="video-modal">
      <CloseButton onClick={onClose} light />
      <div className="video-modal__frame">
        {play ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <button type="button" className="video-modal__poster" onClick={() => setPlay(true)} data-autofocus="">
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" width="480" height="360" loading="lazy" />
            <span className="video-modal__play" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
            </span>
            <span className="sr-only">Reproduzir vídeo: {title}</span>
          </button>
        )}
      </div>
      <p className="video-modal__title mono">{title}</p>
    </Dialog>
  )
}

/* -------- Drawer de produto -------- */
function ProductDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const p = produtoPorId(id)
  if (!p) return null
  return (
    <Dialog label={p.nome} onClose={onClose} variant="drawer" className="drawer">
      <div className="drawer__top">
        <span className="mono mono--steel">Linha completa</span>
        <CloseButton onClick={onClose} />
      </div>
      <h2 className="display drawer__title">{p.nome}</h2>
      <div className="drawer__piece studio">
        <Cutout name={p.recorte} sizes="(min-width: 768px) 420px, 80vw" alt={p.nome} />
      </div>
      <div className="drawer__body">
        <h3 className="mono">Descrição</h3>
        {p.descricao_curta ? <p>{p.descricao_curta}</p> : <p className="drawer__pending">Texto oficial pendente no tatu-content.json.</p>}

        {p.id === 'blocos' && (
          <>
            <h3 className="mono">{vantagens.titulo}</h3>
            <ul className="drawer__list">
              {vantagens.itens.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </>
        )}

        {p.cores && (
          <>
            <h3 className="mono">Cores</h3>
            <ul className="drawer__swatches">
              {p.cores.map((c) => (
                <li key={c.nome}>
                  <span style={{ background: c.amostra }} aria-hidden="true" /> {c.nome}
                </li>
              ))}
            </ul>
            <p className="drawer__note">{p.aviso_cores}</p>
          </>
        )}

        {p.dados_para_caixa.length > 0 && <SpecBox title="Dados" rows={p.dados_para_caixa} />}

        <h3 className="mono">Modelos, vãos e medidas</h3>
        <p className="drawer__pending">Tabela oficial pendente no tatu-content.json.</p>

        <h3 className="mono">Fichas técnicas (PDF)</h3>
        {p.fichas_pdf.length ? (
          <ul className="drawer__files">
            {p.fichas_pdf.map((f) => (
              <li key={f.url}>
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="pill">
                  {f.titulo} · PDF
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="drawer__pending">Links oficiais dos PDFs pendentes no tatu-content.json.</p>
        )}
      </div>
      <div className="drawer__cta btn-row">
        <a className="btn btn--primary" href={waLink(`${ORCAMENTO_MSG} Produto: ${p.nome}.`)} target="_blank" rel="noopener noreferrer">
          Solicitar orçamento
        </a>
      </div>
    </Dialog>
  )
}

/* -------- 16 pontos da fábrica -------- */
function PontosPanel({ onClose }: { onClose: () => void }) {
  const map = estrutura.mapa_oficial_numerado
  const pontos = Array.from({ length: estrutura.total_pontos }, (_, i) => {
    const n = String(i + 1).padStart(2, '0')
    return { n, dado: estrutura.pontos.find((p) => p.n === n) }
  })
  return (
    <Dialog label={`Os ${estrutura.total_pontos} pontos da fábrica`} onClose={onClose} variant="drawer" className="drawer drawer--wide">
      <div className="drawer__top">
        <span className="mono mono--steel">Estrutura</span>
        <CloseButton onClick={onClose} />
      </div>
      <h2 className="display drawer__title">Os {estrutura.total_pontos} pontos</h2>
      {map && asset(map) ? (
        <img src={`${import.meta.env.BASE_URL}img/kit/${map}-1280.webp`} alt="Mapa oficial numerado da fábrica" />
      ) : (
        <PendingPhoto label="Mapa oficial numerado" sub="aguardando arquivo oficial" style={{ aspectRatio: '16 / 9' }} />
      )}
      <p className="drawer__note">{estrutura.conflito_conhecido}</p>
      <ol className="pontos">
        {pontos.map(({ n, dado }) => (
          <li key={n} className={dado ? '' : 'is-pending'}>
            <span className="pontos__n mono">{n}</span>
            {dado ? (
              <span>
                <strong className="pontos__v">{dado.capacidade}</strong> {dado.unidade}
                {dado.descricao && <span className="pontos__d"> · {dado.descricao}</span>}
              </span>
            ) : (
              <span className="pontos__d">Descrição pendente no tatu-content.json</span>
            )}
          </li>
        ))}
        <li>
          <span className="pontos__n mono">Solar</span>
          <span>
            <strong className="pontos__v">{estrutura.energia_solar.rotulo}</strong> {estrutura.energia_solar.nota} · {estrutura.energia_solar.ano}
          </span>
        </li>
      </ol>
    </Dialog>
  )
}

/* -------- Lightbox de documentos de qualidade -------- */
function DocLightbox({ start, onClose }: { start: number; onClose: () => void }) {
  const docs = qualidade.documentos
  const [i, setI] = useState(start)
  const go = (d: number) => setI((v) => (v + d + docs.length) % docs.length)
  const doc = docs[i]
  const title = doc.titulo ?? `Documento ${String(i + 1).padStart(2, '0')}`
  return (
    <Dialog
      label={`${title} — ${i + 1} de ${docs.length}`}
      onClose={onClose}
      variant="full"
      className="lightbox"
      onKey={(e) => {
        if (e.key === 'ArrowRight') go(1)
        if (e.key === 'ArrowLeft') go(-1)
      }}
    >
      <CloseButton onClick={onClose} light />
      <figure className="lightbox__figure">
        {doc.imagem && asset(doc.imagem) ? (
          <img src={`${import.meta.env.BASE_URL}img/kit/${doc.imagem}-1280.webp`} alt={title} />
        ) : (
          <PendingPhoto className="lightbox__pending" label={title} sub="imagem oficial pendente" />
        )}
        <figcaption className="mono" aria-live="polite">
          {String(i + 1).padStart(2, '0')} / {String(docs.length).padStart(2, '0')} · {title}
        </figcaption>
      </figure>
      <div className="lightbox__nav">
        <button type="button" className="btn btn--ghost-light" onClick={() => go(-1)} aria-label="Documento anterior">
          ←
        </button>
        <button type="button" className="btn btn--ghost-light" onClick={() => go(1)} aria-label="Próximo documento">
          →
        </button>
      </div>
    </Dialog>
  )
}
