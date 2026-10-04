# Tatu PreMoldados — site institucional

Site editorial com animação por scroll: **Vite + React + TypeScript + GSAP (ScrollTrigger, SplitText) + Lenis**.
O briefing completo está em [`docs/PROMPT.md`](docs/PROMPT.md).

```bash
npm install
npm run dev                      # desenvolvimento (gera as imagens antes)
npm run build && npm run preview # produção (pré-renderiza o HTML no build)
npm run qa                       # QA automatizado (com o preview rodando na porta 4173)
```

> **Importante — kit incompleto nesta entrega.** O `content/tatu-content.json` original, as referências
> (`referencias/`) e a maior parte das fotos **não chegaram** ao ambiente de desenvolvimento. O arquivo
> `content/tatu-content.json` atual foi montado **somente com fatos citados no briefing**; todo campo
> desconhecido é `null` e aparece no site como pendência visível (nunca como texto inventado).
> Veja a seção [Pendências](#pendências-placeholders).

---

## Estrutura

```
content/tatu-content.json     única fonte de textos/fatos (provisória — ver acima)
assets/recortes/*.png|webp    peças com fundo transparente (nome = chave usada no JSON)
assets/fotos/*.jpg            fotos de obra e da fábrica
scripts/assets.mjs            gera WebP/AVIF em 3 larguras + manifesto (roda no dev e no build)
scripts/prerender.mjs         injeta o HTML renderizado no dist/index.html
src/
  content/tatu.ts             importa e tipa o JSON; helpers (WhatsApp, endereço, assets)
  styles/tokens.css           design tokens (cores, tipos, escala)
  styles/base.css, chrome.css base, botões, caixa de specs, malha, nav, diálogos, rodapé
  components/                 Nav + MobileBar, Cutout, Media (Picture/Pending*), SpecBox,
                              Odometer, Dialog/Modals (vídeo lite, drawer, lightbox), Units
  sections/                   Abertura, Historia, Produtos, DaPecaAObra, Fabrica, Qualidade,
                              Contato, Footer (+ CSS de cada uma)
  motion/setup.ts             plugins, Lenis, matchMedia (desktop/compact/reduced), prime()
  motion/util.ts              medições estáveis (offsetWithin), cores, decode de imagens
qa/                           shots.mjs, run-qa.mjs, qa-report.md, lighthouse/, screenshots/
```

## Como trocar a cor de destaque

Em `src/styles/tokens.css`, altere **só** `--accent-rgb` (canais RGB separados por espaço):

| Cor | Valor |
|---|---|
| Azul técnico (atual) | `46 79 224` |
| Vermelho telha | `180 50 30` |
| Ocre | `192 128 47` |

`--accent`, `--accent-tint` (malha) e `--accent-line` derivam dela. Com ocre, confira o contraste de
textos pequenos sobre o creme (mínimo 4.5:1).

## Como trocar a foto aérea

1. Salve a versão em alta como `assets/fotos/fabrica-aerea.jpg` (ou outro nome e ajuste
   `AERIAL_SRC` em `src/content/tatu.ts`).
2. Ajuste o polígono do telhado solar em `SOLAR_POLY` (`src/sections/Fabrica.tsx`), em % da foto.
   O valor atual é uma **estimativa visual** — use as coordenadas do JSON oficial quando houver.
3. `npm run dev` (o script de assets gera as variantes automaticamente).

## Como adicionar recortes e obras

- **Recorte de produto:** salve `assets/recortes/<nome>.png` (fundo transparente) com o nome do campo
  `recorte` do produto no JSON — p. ex. `vigotas-protendidas.png`, `lajes-alveolares.png`,
  `pisos-intertravados.png`, `guias.png`, `telha-amarela.png`… Ao existir o arquivo, o
  `PendingProduct` some e a peça real (com malha de scan) entra no lugar.
- **Cores da telha:** `telha-natural`, `telha-amarela`, `telha-grafite`, `telha-ocre`, `telha-vermelha`.
  Com os PNGs presentes, as bolinhas viram botões que fazem crossfade da peça.
- **Obras:** salve em `assets/fotos/` com os nomes de `obras[].foto` / `obras[].miniaturas`
  (`obra-laje-vigotas-eps.jpg`, `obra-telhado-bege.jpg`, `obra-telhado-cinza.jpg`,
  `obra-conjunto-casas.jpg`). Para uma nova obra, acrescente um item em `obras` no JSON.
- **Linha do tempo:** preencha `linha_do_tempo[].foto` com o nome do arquivo em `assets/fotos/`.

## Mapa das seções e ScrollTriggers

Contextos de `gsap.matchMedia()`: **desktop** `(min-width:1024px) and (prefers-reduced-motion:no-preference)`,
**compact** `(max-width:1023px) and (…no-preference)`, **reduced** `(prefers-reduced-motion: reduce)`
(sem pin, sem scrub, estado final visível).

| Seção | Trigger | Pin | Fim | Observações |
|---|---|---|---|---|
| Abertura (`#inicio`, `#empresa`) | `section#inicio` top top | `.ab__stage` (desktop) | `+=320%` | `pinSpacing:false` + `.ab__runway` (220svh) reserva o espaço — nada se move quando o JS liga o pin (CLS 0). Scan com malha (técnica 1); “1977” voa (FLIP calculado) até o ano da História; o palco some em 0.998 e revela a História idêntica por baixo. Compact: varredura única ao entrar na tela. |
| História (`#historia`) | `section#historia` top top | `.hist__stage` (desktop) | `+=550%` | `pinSpacing:false` + `.hist__runway` (450svh). Odômetro contínuo (trechos: 50% parado / 50% rolando), textos e fotos trocados por `onUpdate`; final “45 anos”; o bloco sobe até a posição do produto 01. Compact: lista por capítulo com ano sticky. |
| Produtos (`#produtos`) | `section#produtos` top top | `.prod__stage` (desktop) / `.prod__pinbox` (compact) | `+=500%` / `+=300%` | 5 produtos × (35% parado + 65% troca), peça vira wireframe antes de sair; últimos 20%: “Linha completa” (a telha pousa na 7ª posição). Compact sem rotação; linha completa em grid sem pin. |
| Da peça à obra (`#obras`) | `section#obras` top top | `.obra__stage` (desktop) | `+=320%` | 3 trechos: peça → foto dentro da silhueta (técnica 2, `mask-size` 1→7×) → Ken Burns → legenda → cortina. Compact: sem pin, scrub `top 70%`→`top 10%` por trecho. |
| Fábrica (`#fabrica`) | `section#fabrica` top top | `.fab__stage` (desktop) | `+=220%` | Close 2× no telhado solar (translate limitado às bordas) → recuo `z = 2^(1-t)` → título → 4 capacidades (nunca somadas). Compact: zoom 1.4→1 e contagem. |
| Qualidade (`#qualidade`) | entrada | — | — | ISO 9001 por máscara, parágrafo com SplitText (linhas), folhas em leque, lightbox. |
| Contato (`#contato`, `#orcamento`) | entrada | — | — | Telha gira e pousa sobre “a Tatu”; formulário monta a mensagem e abre `wa.me` (fallback `mailto:`). |

Todos os pins usam `anticipatePin: 1`, `invalidateOnRefresh: true`, valores em função e são
re-“primados” a cada `ScrollTrigger.refresh` (`prime()` em `motion/setup.ts`) para que rolar para trás
desfaça tudo sem elementos presos.

## Performance e acessibilidade

- HTML pré-renderizado no build e hidratado; o JS (chunk `boot`) só é avaliado depois que a peça do
  hero (LCP) decodifica. O estado inicial da entrada vem de uma classe `intro` posta no `<head>`.
- Imagens: `<picture>` com AVIF (fotos) + WebP em até 3 larguras, `width`/`height` declarados, lazy em
  tudo menos a peça do hero (`fetchpriority="high"` + preload). Recortes só em WebP (o alfa do AVIF
  com perdas deixava um halo claro). Máscaras/malhas CSS só carregam após o `load` (idle).
- Fontes Archivo (variável, eixo de largura), IBM Plex Sans e Mono servidas localmente (`public/fonts`,
  mesmo arquivo do Google Fonts), com preload.
- Lighthouse (build de produção, `qa/lighthouse/`):
  - **Mobile:** Performance 96 · Acessibilidade 100 · Boas práticas 100 · SEO 100 — LCP 2.3 s, CLS 0, TBT 180 ms
  - **Desktop:** Performance 98 · Acessibilidade 100 · Boas práticas 100 · SEO 100
- JS inicial: ~1 KB (entrada) + ~142 KB gzip (chunk de app/GSAP/React, carregado após o LCP).

## QA

`qa/qa-report.md` (gerado por `npm run qa`): imagens, âncoras, `wa.me` com texto, validação e envio do
formulário, checagem automática de números/datas visíveis contra o JSON, teclado (drawer com Enter/Esc
e foco devolvido), overflow em 360/390 px, áreas de toque ≥ 44 px, reduced-motion sem pins, resize
1440→390→1440 no meio de um pin, console limpo. **Todos OK** nesta entrega.

`qa/screenshots/`: 1440×900, 1024×768 e 390×844 de 0% a 100% da página (passo de 10%) e
`reduced-motion/`. Testado em Chromium; Safari e Firefox **não** foram testados neste ambiente.

## Pendências (placeholders)

Itens que aparecem no site como pendência elegante e somem sozinhos quando o dado/arquivo chegar:

**Conteúdo (`content/tatu-content.json`)**
- JSON oficial inteiro. O provisório traz só: início 1977; Km 134 · Via Anhanguera · Limeira/SP;
  ISO 9001 (2002); 45 anos (2022); vídeo `PPyvJa9HZ2M`; WhatsApp vendas 5519998098949; os 8
  produtos; vantagens dos blocos; cores da telha + aviso; marcos 1993/1998/2000/2009/2011/2020;
  capacidades dos pontos 02/03/14/15 e energia solar (+8.000 m²).
- `empresa.texto_curto` — o parágrafo da empresa hoje é composto só com os fatos acima.
- Linha do tempo: 12 marcos em vez de 26; 1980, 2001 e 2007 sem título/texto (“Acervo”); a divisão
  dos capítulos I–IV é provisória.
- Descrição curta, modelos/vãos/medidas e fichas técnicas (PDF) de todos os produtos;
  `dados_para_caixa` de Lajes Alveolares, Blocos Decorativos, Pisos Drenantes e Guias.
- Endereço completo + CEP, telefone fixo, e-mail, redes sociais, links de Downloads e Loja virtual,
  políticas (PDF).
- Descrição dos 16 pontos da fábrica (só 02, 03, 14 e 15 têm números) e o mapa oficial numerado.
- Os 8 documentos de qualidade (título + imagem) e a Menção Honrosa Sinaprocim (não implementada).
- ID do vídeo da fábrica (usa o vídeo institucional até confirmação).
- Logo oficial (`logo_topo`/`logo_rodape`) — hoje há uma marca tipográfica provisória.

**Arquivos (`assets/`)**
- Recortes: `vigotas-protendidas`, `lajes-alveolares`, `pisos-intertravados`, `blocos-decorativos`,
  `pisos-drenantes`, `guias`, `telha-<cor>` (5).
- Fotos: `fabrica-aerea`, `obra-laje-vigotas-eps`, `obra-telhado-bege`, `obra-telhado-cinza`,
  `obra-conjunto-casas`, fotos oficiais da linha do tempo e o selo de 45 anos.
- Coordenadas oficiais do polígono solar.

**Desvios conscientes do briefing**
- A peça do hero entra sem fade de opacidade (só sobe e gira): ela é o LCP e precisa aparecer no
  primeiro paint.
- O “1977” da abertura usa um FLIP calculado (medição com `offsetLeft/Top`) em vez do plugin `Flip`,
  porque o alvo está em outra seção fixada.
- Fontes servidas localmente em vez do CDN do Google Fonts (mesmos arquivos; melhor LCP/privacidade).
- Wordmark no mobile limitado a 24vw para caber em 360 px; ISO 9001 começa em 80 px no mobile.

## Vídeo da produção e melhoria de imagens

- `assets/video/producao.mp4` → `npm run frames` (roda no dev/build): trechos definidos em
  `producao.trechos` no JSON (hoje 0:03–0:06 e 0:20–0:30), faixas pretas recortadas automaticamente,
  redução de ruído, super-resolução 2× (FSRCNN) e WebP em 1600/900 px.
- Fotos: originais em `assets/originais/`. As fotos pequenas exibidas grandes foram ampliadas com
  `scripts/superres.py` (EDSR/FSRCNN, OpenCV `dnn_superres`); as demais receberam nitidez leve.
  Ex.: `python3 scripts/superres.py assets/originais/x.jpg assets/fotos/x.jpg --model edsr`.
  Requer `pip install opencv-contrib-python-headless`.
