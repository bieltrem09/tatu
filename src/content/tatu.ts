// Única fonte de texto/fatos do site. Tudo vem de content/tatu-content.json.
import raw from '../../content/tatu-content.json'
import assetsManifest from './assets.gen.json'

export type Spec = { rotulo: string; valor: string; nota: string }
export type Cor = { nome: string; recorte: string; amostra: string }
export type Produto = {
  id: string
  nome: string
  palavra: string
  recorte: string
  destaque: boolean
  descricao_curta: string | null
  dados_para_caixa: Spec[]
  fichas_pdf: { titulo: string; url: string }[]
  cores?: Cor[]
  aviso_cores?: string
}
export type Marco = {
  ano: number
  capitulo: string
  titulo: string | null
  texto: string | null
  foto: string | null
  tem_foto_oficial: boolean
  selo?: boolean
}
export type Ponto = { n: string; capacidade: string; unidade: string; descricao: string | null }
export type Obra = { produto: string; recorte: string; foto: string; miniaturas: string[]; legenda: string }
export type Documento = { titulo: string | null; imagem: string | null }

type Content = {
  empresa: {
    nome: string
    inicio: number
    linha_hero: string
    texto_curto: string | null
    localizacao: { km: string; rodovia: string; cidade: string }
    endereco_completo: string | null
    cep: string | null
    iso9001: { norma: string; ano: number }
    anos_de_historia: { valor: number; ano: number }
    video: { youtube_id: string; titulo: string }
    logo_topo: string | null
    logo_rodape: string | null
    complementos_pagina_empresa: { ano: number; valor: string; nota: string }[]
  }
  contato: {
    telefone: string | null
    whatsapp_vendas: string
    email: string | null
    redes: { nome: string; url: string }[]
    links: { loja_virtual: string | null; downloads: string | null; politicas_pdf: { titulo: string; url: string }[] }
  }
  vantagens_blocos: { titulo: string; itens: string[] }
  produtos: Produto[]
  capitulos: { id: string; nome: string }[]
  linha_do_tempo: Marco[]
  estrutura: {
    conflito_conhecido: string
    total_pontos: number
    mapa_oficial_numerado: string | null
    energia_solar: { ano: number; area_m2: number; rotulo: string; nota: string }
    pontos: Ponto[]
    video_fabrica: { youtube_id: string; titulo: string }
  }
  qualidade: { texto: string; documentos: Documento[] }
  obras: Obra[]
  fotos_do_kit: Record<string, string>
}

export const tatu = raw as unknown as Content
export const { empresa, contato, produtos, estrutura, qualidade, obras } = tatu
export const marcos = tatu.linha_do_tempo
export const capitulos = tatu.capitulos
export const vantagens = tatu.vantagens_blocos

/** Os 5 produtos da sequência principal (Produtos / Lagunitas), na ordem do briefing. */
export const SEQUENCIA = ['blocos', 'lajes-protendidas', 'lajes-alveolares', 'pisos-intertravados', 'telhas']
export const sequencia = SEQUENCIA.map((id) => produtos.find((p) => p.id === id)!).filter(Boolean)
export const produtoPorId = (id: string) => produtos.find((p) => p.id === id)

export const altDe = (name: string) => tatu.fotos_do_kit[name] ?? ''

/* ---------- Assets do kit (gerados por scripts/assets.mjs) ---------- */
export type AssetInfo = { kind: 'cutout' | 'photo'; width: number; height: number; widths: number[] }
const manifest = assetsManifest as unknown as Record<string, AssetInfo>
export const asset = (name: string | null | undefined): AssetInfo | undefined => (name ? manifest[name] : undefined)
export const assetUrl = (name: string, prefer = 1200, ext: 'webp' | 'avif' = 'webp') => {
  const a = manifest[name]
  if (!a) return ''
  const w = a.widths.find((x) => x >= prefer) ?? a.widths[a.widths.length - 1]
  return `${import.meta.env.BASE_URL}img/kit/${name}-${w}.${ext}`
}

/** Troque por uma versão em alta quando a Tatu enviar (ver README). */
export const AERIAL_SRC = 'fabrica-aerea'

/* ---------- Derivados (sem inventar: só formatação) ---------- */
export const whatsappDigits = contato.whatsapp_vendas
export const whatsappLabel = (() => {
  const d = whatsappDigits.replace(/^55/, '')
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
})()
export const waLink = (text?: string) =>
  `https://wa.me/${whatsappDigits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
export const enderecoCurto = `${empresa.localizacao.km} · ${empresa.localizacao.rodovia} · ${empresa.localizacao.cidade}`
export const textoEmpresa =
  empresa.texto_curto ??
  `Pré-moldados de concreto desde ${empresa.inicio}, no ${empresa.localizacao.km} da ${empresa.localizacao.rodovia}, em ${empresa.localizacao.cidade}. Certificação ${empresa.iso9001.norma} desde ${empresa.iso9001.ano}.`
export const ORCAMENTO_MSG = 'Olá, Tatu PreMoldados! Gostaria de solicitar um orçamento.'
export const CONTATO_MSG = 'Olá, Tatu PreMoldados! Vim pelo site e gostaria de falar com vendas.'
