# Site institucional Tatu PreMoldados — briefing de construção

Você é um **diretor de arte + engenheiro front-end sênior** especializado em sites editoriais com animação por scroll (GSAP/ScrollTrigger). Sua tarefa é construir, testar e entregar **o site funcionando** — código real, não mockup, não descrição.

Este kit acompanha o prompt:

```
PROMPT.md                      ← este arquivo
content/tatu-content.json      ← TODO o conteúdo permitido (textos, datas, números, URLs oficiais)
assets/recortes/*.png          ← peças reais recortadas, fundo transparente (blocos, vigotas, telha)
assets/fotos/*.jpg             ← fotos reais: vista aérea da fábrica e obras com os produtos aplicados
referencias/                   ← vídeos e quadros das referências visuais (ver seção 2)
```

Leia tudo antes de escrever código. Abra as imagens de `referencias/` e assista aos dois `.mp4`.

---

## 0. Regras inegociáveis

1. **Nenhum fato inventado.** Todo texto, data, número, capacidade, certificação e nome de produto sai de `content/tatu-content.json`. Se não está lá, não entra. Slogans curtos de interface ("Fale com a Tatu", "Linha completa", "Da peça à obra") são permitidos; afirmações sobre a empresa, não.
2. Conflito de datas → vale `linha_do_tempo`. Na seção Fábrica use só os números por ponto de `estrutura` e **nunca some capacidades** (leia `estrutura.conflito_conhecido`).
3. **Não nomear obras, clientes ou cidades** nas legendas das fotos de obra. Use as legendas genéricas do kit até a Tatu confirmar.
4. Fotografia real sempre que existir. Onde faltar foto (ver seção 9), use o componente `PendingProduct` — nunca imagem de banco nem gerada por IA.
5. Proibido: bounce, textos voando aleatoriamente, excesso de blur, partículas, gradiente neon, estética futurista genérica, cards genéricos de template, emoji como ícone, glassmorphism.
6. Todo movimento deve ter relação com o conteúdo: peça, obra, escala, tempo.

---

## 1. Conceito

**Minimalismo industrial + arquitetura editorial.** Um estúdio claro e silencioso onde peças de concreto reais são as protagonistas, com tipografia gigante e uma única cor de destaque.

A página inteira é **uma narrativa contínua**: o objeto nunca some de repente, ele se transforma no próximo assunto.

- O bloco do hero é escaneado e vira a empresa.
- O ano de fundação vira a linha do tempo.
- Os "45 anos" dão lugar aos produtos.
- Cada peça vira a obra onde foi aplicada.
- A câmera recua até a fábrica inteira.
- A telha pousa no contato.

---

## 2. Referências (em `referencias/`) — o que tirar de cada uma

| Referência | O que copiar como **técnica** (não como aparência) | Onde usar na Tatu |
|---|---|---|
| `ref1-video-3d-oficina.mp4` | Estúdio claro e neutro; malha wireframe na cor de destaque que **varre o objeto e vira material real**; etiquetas brancas com **linha-guia** apontando partes da peça; **câmera que recua** revelando o cenário inteiro. | Scan do bloco no hero; close → recuo na foto aérea da fábrica. |
| `ref2-lagunitas.mp4` | O produto recortado com sombra macia fica **fixo no centro** enquanto o **título condensado gigante sobe por trás dele** (o produto cobre parte das letras); caixa de especificações com borda e números grandes; no fim o produto **encolhe para uma fileira** com a linha completa. | Seção Produtos inteira. |
| `ref3-homelo-hero.jpg` | Wordmark gigante ocupando a largura com o objeto **sobreposto à parte de baixo das letras**; nav em pílula; tags em pílula; fundo creme em degradê. | Hero. |

---

## 3. Design system

### Cores (CSS custom properties em `:root`)

```css
--paper:   #FBFAF7;  /* centro do estúdio */
--cement-1:#F0EDE7;
--cement-2:#E2DED6;  /* borda do estúdio, divisórias claras */
--cement-3:#CFCAC1;
--cement-4:#BDB7AC;  /* linhas finas */
--steel:   #57534D;  /* texto secundário (passa 4.5:1 sobre paper) */
--ink:     #141413;  /* texto principal, botões escuros */
--accent:  #2E4FE0;  /* azul técnico — ÚNICA cor de destaque */
--accent-tint: rgb(46 79 224 / .12);
--accent-line: rgb(46 79 224 / .70);
```

- A cor de destaque precisa ser trocável num lugar só. As alternativas aprovadas são vermelho telha `#B4321E` e ocre `#C0802F`.
- Use o destaque só em: malha de scan, linha de varredura, rótulos pequenos, CTA principal, palavra gigante dos produtos e números de estrutura.
- Nunca use o destaque como texto pequeno sobre fundo creme se o contraste for menor que 4.5:1.
- **Fundo das seções claras:** `radial-gradient(70% 65% at 50% 48%, var(--paper) 0%, var(--cement-1) 55%, var(--cement-2) 100%)`.
- **Seções escuras** (foto da obra e fábrica): `--ink` + gradientes pretos sobre a foto para garantir a leitura.

### Tipografia (Google Fonts, `display=swap`, faça preload das usadas acima da dobra)

| Papel | Fonte | Ajustes |
|---|---|---|
| Wordmark "TATU" | **Archivo** variável | `font-stretch:125%; font-weight:900; letter-spacing:-.035em; line-height:.8` |
| Títulos gigantes / nomes de produto | **Archivo** variável | `font-stretch:72%; font-weight:900; text-transform:uppercase; line-height:.86` |
| Texto | **IBM Plex Sans** 300/400/500 | 16–18 px, line-height 1.55 |
| Rótulos, anos, medidas, índices | **IBM Plex Mono** 400/500 | 11 px, `letter-spacing:.12em`, uppercase |

Escala fluida:
- wordmark: `clamp(96px, 21vw, 320px)`;
- palavra gigante dos produtos: `clamp(120px, 23vw, 340px)`;
- H2: `clamp(56px, 10vw, 150px)`.

### Layout e detalhes
- **Grid:** 12 colunas, gutter 24 px, margem 80 px (desktop), 40 px (tablet), 20 px (mobile).
- **Nav:** pílula branca translúcida (`rgba(255,255,255,.72)`, borda `--cement-2`, raio 999px), fixa no topo. Esconde ao rolar para baixo e volta ao rolar para cima. Mostra a seção ativa.
- **Botões:**
  - Primário: pílula `--accent` com texto branco.
  - Secundário: pílula `--ink` com texto creme.
  - Terciário: pílula com contorno de 1px.
  - Altura mínima de 44 px.
- **Sombra das peças recortadas:** `filter: drop-shadow(0 34px 34px rgb(40 34 26 / .25))` + uma elipse de chão (radial-gradient) logo abaixo da peça.
- **Caixa de especificações** (estilo Lagunitas): borda 2px `--ink`, fundo `rgba(255,255,255,.45)`, cada linha com rótulo mono / valor em display condensado 46–48px / nota em 12px `--steel`.

### Movimento (tokens)

| Tipo | Easing | Duração |
|---|---|---|
| Entradas | `expo.out` | 1.1–1.4 s, stagger 0.06 |
| Trocas | `power3.inOut` | — |
| Hover | `power2.out` | 200 ms |
| Scrub | `scrub: 1` | — |

- Dentro de timelines com scrub, use `ease: "none"` ou `power2.inOut` por tween.
- Anime **somente** `transform`, `opacity`, `clip-path` e `mask-size`/`mask-position`. Nunca anime width, height, top ou left.
- Textos que entram "por máscara": wrapper com `overflow:hidden` e filho com `yPercent: 105 → 0`. Use SplitText (gratuito no GSAP 3.13+) para linhas.

---

## 4. Stack e arquitetura

- **Base:** Vite + React + TypeScript, com `gsap`, `@gsap/react` (`useGSAP`), `ScrollTrigger`, `Flip` e `SplitText`.
- **Lenis** para scroll suave, sincronizado com ScrollTrigger (`lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker`). Desligado com `prefers-reduced-motion`.
- Sem framework de UI. CSS moderno (custom properties, `clamp`, container queries quando úteis) em CSS Modules ou arquivos por seção.
- Estrutura sugerida:

```
src/
  content/tatu.ts            ← importa e tipa tatu-content.json (única fonte de texto)
  styles/tokens.css, base.css
  components/  Nav, MobileBar, Cutout (img + sombra + malha), ScanMesh, SpecBox,
               GiantWord, MaskLines, Odometer, Lightbox, VideoModal (lite YouTube),
               PendingProduct, Button
  sections/    Abertura (Hero + A Tatu), Historia, Produtos, DaPecaAObra,
               Fabrica, Qualidade, Contato, Footer
  motion/      useSectionTimeline.ts (gsap.matchMedia + cleanup), presets.ts
  App.tsx
```

- Cada seção cria suas animações dentro de `gsap.matchMedia()` com três contextos:
  - `desktop`: `(min-width:1024px) and (prefers-reduced-motion:no-preference)`
  - `compact`: `(max-width:1023px) and (prefers-reduced-motion:no-preference)`
  - `reduced`: `(prefers-reduced-motion:reduce)` → sem pin, sem scrub, estado final visível, fades de até 200 ms.
- **Pins:** use `pin: true` + `anticipatePin: 1`.
- **Refresh:** chame `ScrollTrigger.refresh()` depois de `document.fonts.ready` e de `img.decode()` das imagens dos pins.
- **Resize/orientação:** tudo recalcula com `invalidateOnRefresh: true` e valores em funções.

### Técnica-chave 1 — malha de scan com a silhueta exata da peça
Uma `div` do mesmo tamanho do recorte, com estas propriedades:
- `mask-image` = o próprio PNG recortado (`mask-size:100% 100%`, `no-repeat`; inclua o prefixo `-webkit-mask-*`);
- `background-color: var(--accent-tint)`;
- `background-image`: duas `linear-gradient` de 1px (0° e 90°) em `var(--accent-line)`, com `background-size: 14px 14px`.

O resultado é uma grade azul com o formato exato da peça. Para a varredura:
- a foto real usa `clip-path: inset(0 X% 0 0)`, com X indo de 100 → 0;
- a malha usa `clip-path: inset(0 0 0 Y%)`, com Y indo de 0 → 100;
- a linha de scan é uma barra de 2px `--accent` com `box-shadow` de brilho, sincronizada com a varredura.

### Técnica-chave 2 — peça vira janela para a obra
- A foto da obra fica em tela cheia com `mask-image` = recorte da peça, centralizada.
- Anime o `mask-size` de `largura×altura da peça` até **7×**, usando um proxy `{s}` no GSAP e `onUpdate` que aplica `mask-size` e `-webkit-mask-size`.
- No meio do caminho, a foto inteira (sem máscara) entra por cima com opacidade + Ken Burns `scale 1.08 → 1`. Isso evita "zoom num buraco" quando o centro da peça for vazado.

---

## 5. Seções — coreografia detalhada (desktop)

Os percentuais são o progresso do ScrollTrigger da seção (0 → 1).

### 5.1 Abertura: Hero → Scan → A Tatu (um único pin, `end: "+=320%"`)

**Ao carregar** (não depende de scroll, total ≤ 1.6 s, não bloqueia o LCP):
- **Letras:** cada letra de "TATU" sobe por máscara (`yPercent 105→0`, stagger .06, `expo.out` 1.1 s).
- **Linha acima:** "Pré-moldados de concreto desde 1977" com fade + y 14→0. É um fato: início em 1977.
- **Peça:** o recorte `blocos.png` (≈600 px de largura, centro em 50% / 62% da viewport) sobe de y+140 com `rotate -6°→0`, opacidade 0→1, `expo.out` 1.4 s, delay .2. A peça **cobre a parte de baixo das letras**: o z-index da peça é maior que o do wordmark.
- **Laterais:**
  - à esquerda, texto curto + CTA "Solicitar orçamento";
  - à direita, tags em pílula (Blocos, Lajes, Pisos, Telhas, Guias) + "Explorar ↓".

**Scroll (scrub):**

| Progresso | O que acontece |
|---|---|
| 0–.10 | Letras saem para cima por máscara (`yPercent 0→-108`, stagger); a linha e as laterais somem. |
| .06–.14 | O bloco desliza para x≈39% e cresce para ≈640 px. |
| .08–.12 | A malha aparece (opacidade 0→1) e a foto cai para .15 de opacidade ("fantasma"). |
| .12–.40 | **Varredura** da esquerda para a direita (técnica-chave 1), com a linha de scan. |
| .14–.20 | À direita entra o rótulo mono "Vantagens da alvenaria com blocos de concreto" + título condensado "Bloco de concreto". |
| .28–.40 | 4 etiquetas brancas com linha-guia entram em stagger (a linha nasce com `scaleX` a partir do ponto azul na peça): **Resistência ao fogo · Bom isolamento térmico e acústico · Baixa manutenção · Durabilidade**. |
| .44–.50 | A malha some; a foto volta a 100%. |
| .50–.56 | Etiquetas e título do scan saem. |
| .52–.70 | O bloco vai para x≈60%, encolhe para ≈430 px, `rotate 3°`. |
| .58–.74 | À esquerda, por máscara de linhas: rótulo "A empresa" + H2 condensado "Desde / 1977" + parágrafo `empresa.texto_curto` + botões "Ver a linha do tempo" e "Assistir ao vídeo" (abre `VideoModal` com o YouTube `PPyvJa9HZ2M`). |
| .70–.80 | À direita entra a caixa de especificações: Início 1977 · Km 134 (Via Anhanguera · Limeira/SP) · ISO 9001 (certificação obtida em 2002). |
| .86–1 | **Transição para a História:** use `Flip` para levar o "1977" da caixa até a posição e o tamanho do ano gigante da História (o elemento real da próxima seção). Ao mesmo tempo, o bloco desce e some, e o resto da Abertura faz fade. |

### 5.2 História (pin, `end: "+=550%"`, 26 marcos de `linha_do_tempo`)

**Composição:** fundo do estúdio claro.
- **Ano gigante** em display condensado na cor de destaque, `clamp(200px, 30vw, 430px)`, centralizado.
- **Pilha de "fotos impressas":** borda branca de 10–12 px, sombra profunda, rotações de −9° a +6°, **sobre** os dígitos do meio do ano.
- **Esquerda abaixo:** rótulo mono com o ano + título curto + texto do marco.
- **Direita:** caixa de especificações do capítulo (só números que existem no JSON).
- **Rodapé:** régua 1977–2022 com um traço por marco, um preenchimento na cor de destaque que acompanha o progresso e os rótulos dos capítulos (I Origem · II Diversificação · III Escala · IV Consolidação).

**Movimento:**
- **Ano = contador mecânico (`Odometer`):** cada dígito é uma coluna 0–9 dentro de uma máscara. O valor do ano é contínuo e cada coluna rola com a lógica de odômetro: um dígito só gira quando o de menor ordem passa de 9 para 0. Exemplo: 1988 → 1993 só gira os dois últimos dígitos. Divida o progresso em 26 trechos; em cada trecho o ano fica parado nos primeiros 50% e rola nos últimos 50% (`power2.inOut`).
- **Texto do marco:** troca por máscara (o atual sai com `yPercent -100`, o novo entra de 100).
- **Fotos:** os marcos com `foto` (1977, 1980, 1993, 2001, 2007, 2020, selo 2022) **jogam uma nova cópia impressa na mesa**: entra de cima/lado com `rotate ±15°`, `scale 1.1`, e assenta em `rotate` aleatório entre −4° e 6° com sombra crescendo. As anteriores continuam empilhadas, levemente escurecidas.
- **Caixa do capítulo:**
  - III: "+500%" (capacidade de vigotas, 1993, de `empresa.complementos_pagina_empresa`) e "+40% ×2" (blocos, 1998 e 2000).
  - IV: "2.000 m²/dia" (2009) e "150.000 blocos/dia ou 9.000 m² pisos/dia" (2011).
- **Final (2022):** o "45" de "45 anos de história" cresce, o selo oficial de 45 anos assenta por cima e tudo recua para dar lugar aos Produtos. O recorte de blocos reaparece subindo do rodapé, que é o produto 01.

> As fotos da linha do tempo estão em URLs oficiais no JSON. Baixe-as para `public/img/oficial/` se tiver acesso à internet; se não, use `PendingPhoto` (moldura impressa vazia com o rótulo "foto oficial · ano").

### 5.3 Produtos (pin, `end: "+=500%"`, efeito Lagunitas)

**Sequência de 5:** 01 Blocos de Concreto · 02 Lajes Protendidas · 03 Lajes Alveolares · 04 Pisos Intertravados · 05 Telhas de Concreto.

**Layout fixo:**
- **Centro:** peça recortada (centro em 50% / 52%).
- **Atrás da peça:** palavra gigante condensada na cor de destaque (BLOCOS, LAJES, ALVEOLAR, PISOS, TELHAS).
- **Esquerda:** índice "01 / 05" + nome em display 76px + descrição curta + botões "Solicitar orçamento" / "Ver na obra".
- **Direita:** caixa de especificações com os 3 `dados_para_caixa` do produto.
- **Rodapé:** barra de progresso em 5 segmentos com os nomes.

**Cada intervalo de produto** = 35% parado + 65% de troca.
- **Parado:** a palavra gigante sobe devagar (`y 250→190 px`) atrás da peça, que fica imóvel.
- **Troca, 1ª metade:** a peça atual faz `rotate 0→-14°`, `scale 1→.82`, `y 0→-50`. A malha (técnica 1) aparece e a foto some. **A peça vira wireframe antes de sair.**
- **Troca, 2ª metade:** a próxima peça entra como malha com `rotate 12°→0`, `scale .82→1`, `y 60→0` e se materializa (a malha some e a foto aparece).
- **Palavra gigante:** a atual continua subindo e sai pelo topo; a próxima vem de baixo da tela até a posição.
- **Índice e nome:** trocam por máscara (`yPercent`).
- **Caixa:** as 3 linhas trocam em stagger .15.

**Telhas (05):** abaixo da caixa, 5 bolinhas de cor (Natural, Amarela, Grafite, Ocre, Vermelha). Ao clicar, a peça faz crossfade para o PNG oficial daquela cor (URLs em `produtos[telhas].cores`). Mantenha o aviso oficial "A simulação de cores pode variar dependendo do tipo de monitor."

**Final, "Linha completa" (últimos 20% do pin):**
- Com `Flip`, a telha encolhe e pousa na 7ª posição de uma fileira de 8 produtos (na ordem do JSON).
- As outras 7 sobem do rodapé (`y 260→0`, stagger .05) sobre uma linha de chão, cada uma com sombra e rótulo (índice mono + nome).
- O título "Linha completa" entra por máscara.
- Cada item é um link acessível que abre um painel lateral (drawer) com texto completo, vantagens, modelos, vãos/medidas e **downloads das fichas técnicas (PDF oficiais)**.

### 5.4 Da peça à obra (pin, `end: "+=320%"`, 3 trechos)

| Trecho | Peça | Foto principal | Miniaturas | Legenda |
|---|---|---|---|---|
| 01 | `blocos.png` | `obra-blocos-edificio.jpg` | `obra-blocos-edificio-2.jpg`, `obra-arquibancada.jpg` | "Alvenaria em blocos" |
| 02 | `vigotas-protendidas.png` | `obra-laje-vigotas-eps.jpg` | — | "Laje em montagem" |
| 03 | `telha.png` | `obra-telhado-bege.jpg` | `obra-telhado-cinza.jpg`, `obra-conjunto-casas.jpg` | "Cobertura" |

Em cada trecho (0 → 1):
- **0–.15:** a peça entra (`y 120→0`, `scale .94→1`) no estúdio claro, com a palavra gigante atrás. Rótulos "Da peça à obra · 0N / 03" e "A peça" + nome do produto.
- **.20–.55:** **técnica-chave 2.** A foto aparece exatamente dentro da silhueta da peça e cresce. O recorte original faz fade entre .24 e .32.
- **.45–.60:** a foto inteira assume com Ken Burns.
- **.60–.78:**
  - gradiente escuro na base;
  - rótulo branco "A obra · Nome do produto" + legenda em display 96 px;
  - miniaturas com borda branca de 4 px, levemente giradas, entrando por baixo.
- **.86–1:** a foto sai com `clip-path: inset(0 0 100% 0)` (cortina subindo) e revela o estúdio para a próxima peça.

> Se tiver internet: baixe as galerias oficiais (padrões de URL `galeria_oficial_padrao` no JSON), escolha 2–3 fotos boas por produto e adicione-as como miniaturas extras, sem legendas inventadas.

### 5.5 Fábrica (pin, `end: "+=220%"`, foto aérea real)

**Base:** `fabrica-aerea.jpg` cobrindo a tela, com câmera = `scale` + `translate` num wrapper. **Restrinja o translate** para nunca mostrar a borda da imagem.

| Progresso | O que acontece |
|---|---|
| 0–.16 | **Close no telhado solar** (zoom 2×). Um polígono (`clip-path` com as coordenadas percentuais do JSON) recebe uma grade isométrica azul (dois `repeating-linear-gradient` a 118° e 28°) que aparece como o scan da ref. 1. Etiqueta branca com linha-guia: "Energia solar · investimento de 2020 / **+8.000 m²** / de placas solares", com contador de 0 até 8.000. |
| .16–.56 | **A câmera recua** até 1× (escala interpolada exponencialmente: `z = 2^(1-t)`); a etiqueta sai. |
| .50–.64 | Gradiente escuro da esquerda; título "A fábrica" (display 140 px, branco), endereço e botões "Assistir: TATU PRÉ-MOLDADOS – Limeira/SP" (`VideoModal`) e "Ver os 16 pontos". |
| .66–.84 | Faixa inferior com 4 capacidades e contagem progressiva: 125.000 blocos/dia (ponto 03) · 7.200 metros/dia (ponto 14) · 2.000 m²/dia (ponto 15) · 2.200 m²/dia (ponto 02). |

**"Ver os 16 pontos"** abre um painel com o mapa oficial numerado (`estrutura.mapa_oficial_numerado`) e a lista completa dos 16 pontos + energia solar. Não invente posições de pinos sobre a foto aérea.

### 5.6 Qualidade (sem pin)
- **Composição:**
  - "ISO 9001" em display condensado gigante (`clamp(160px, 25vw, 360px)`), revelado por máscara;
  - acima, o parágrafo sobre a certificação de 2002;
  - abaixo, os 8 documentos do JSON como folhas brancas em leque, cada uma com rotação entre −8° e +6° e sombra.
- **Entrada:** stagger .08, de y+80 e rotação 0 até a rotação final.
- **Interação:** clique abre `Lightbox` com a imagem oficial e o título (foco preso, Esc fecha, setas navegam).
- **Opcional:** bloco "Menção Honrosa Sinaprocim" com o texto e as 2 imagens do JSON.

### 5.7 Contato
- **Composição:**
  - "Fale com / a Tatu" em display condensado gigante na cor de destaque, à esquerda;
  - o recorte `telha.png` entra girando (`rotate -40°→-18°`, `y -200→0`) e **pousa sobre "A TATU"** com sombra;
  - abaixo, a lista: Fábrica (endereço completo + CEP), Telefone (`tel:`), WhatsApp vendas (`wa.me`), E-mail (`mailto:`).
- **CTAs:** **SOLICITAR ORÇAMENTO** (cor de destaque) e **FALAR NO WHATSAPP** (escuro).
- **Formulário** (Nome, Telefone ou e-mail, Produto — select com os 8 —, Mensagem):
  - com labels visíveis e validação inline;
  - o envio **monta uma mensagem e abre o WhatsApp** `https://wa.me/5519998098949?text=...`, porque não há backend;
  - fallback `mailto:` com o mesmo conteúdo.
- **Rodapé:** logo, endereço, links (Empresa, Linha do tempo, Estrutura, Qualidade, Vendas, Downloads, Loja virtual), redes sociais, políticas (PDFs oficiais) e © com o ano atual.

### 5.8 Logo
Use o logo oficial (`empresa.logo_topo` / `logo_rodape`) na nav e no rodapé se conseguir baixar. O "TATU" gigante do hero é tipográfico, em Archivo, e conversa com a marca sem substituí-la.

---

## 6. Mobile e tablet (< 1024 px) — adaptar, não encolher

- **Nav:** a pílula vira logo + botão de menu (44×44) que abre um overlay em tela cheia, com links grandes e foco gerenciado.
- **Barra fixa inferior** em todas as seções: "Orçamento" (cor de destaque) + "WhatsApp" (escuro), com `env(safe-area-inset-bottom)`.
- **Abertura:**
  - wordmark `clamp(96px, 28vw, 140px)`, com a peça (≈320 px) sobreposta às letras;
  - scan sem pin: a varredura acontece uma vez, quando a peça entra na tela;
  - as 4 vantagens viram lista abaixo da peça.
- **História:** sem pin horizontal. Lista vertical de capítulos; o ano fica `position: sticky` no topo do capítulo e rola com o odômetro conforme cada marco cruza o meio da tela; as fotos aparecem inline.
- **Produtos:** pin curto (`+=300%`). Use só `scale`, `y` e malha, sem rotação. Caixa de especificações em 3 colunas compactas abaixo do texto. A "Linha completa" vira grid 2×4 sem pin.
- **Da peça à obra:** sem pin. A máscara cresce ao entrar na tela (`scrub` curto com `start: "top 70%"`, `end: "top 10%"`).
- **Fábrica:** a foto com zoom leve (1.4 → 1) e as capacidades em grid 2×2.
- **Geral:** use `100svh` em vez de `100vh`, sem overflow horizontal e com áreas de toque ≥ 44 px.

---

## 7. Performance

- **Imagens:**
  - converta para AVIF + WebP com fallback, em 3 larguras (`<picture>` + `srcset` + `sizes`), sempre com `width`/`height` declarados;
  - recortes em WebP/AVIF com alfa;
  - `loading="lazy"` e `decoding="async"` em tudo, menos na peça do hero (`fetchpriority="high"`).
- **Orçamento:**
  - LCP < 2.5 s (4G, celular médio);
  - CLS < 0.05;
  - JS inicial < 150 KB gzip.
- **Carregamento:** GSAP, Lenis e as seções abaixo da dobra entram com import dinâmico quando a seção se aproxima.
- **Animação:**
  - `will-change` só durante os pins (adicione e remova via callbacks do ScrollTrigger);
  - nada de animar `filter: blur` em áreas grandes;
  - sombras em camadas estáticas.
- **Vídeo:** `VideoModal` usa "lite embed" — só a miniatura até o clique, e o iframe `youtube-nocookie.com` só depois.
- **Meta:** 60 fps nos pins em um notebook comum (meça no Performance do Chrome).

---

## 8. Acessibilidade e SEO

- **Estrutura:** `lang="pt-BR"`, landmarks (`header`, `nav`, `main`, `section` com `aria-labelledby`, `footer`) e um único H1 (o "TATU" do hero, com `aria-label="Tatu PreMoldados"`).
- **Textos decorativos:** as palavras gigantes duplicadas e as colunas do odômetro levam `aria-hidden="true"`, e o valor real vai em texto visualmente oculto.
- **Imagens:** alt text conforme `fotos_do_kit` e os nomes dos produtos.
- **Teclado:** foco visível na cor de destaque com 2 px e offset de 3 px; tudo navegável por teclado; modais com foco preso e restaurado ao fechar.
- **Contraste:** mínimo 4.5:1 para texto.
- **Reduced motion:** respeitado por completo (ver seção 4).
- **SEO:**
  - `<title>` "Tatu PreMoldados | Blocos, Lajes, Pisos, Telhas e Guias de Concreto | Limeira/SP";
  - meta description factual;
  - Open Graph com a peça do hero;
  - JSON-LD `LocalBusiness`/`Organization` com endereço, telefone, e-mail e redes, só com dados do JSON.

---

## 9. Pendências conhecidas — trate com elegância, não esconda

- **Sem recorte no kit:** Lajes Alveolares, Pisos Intertravados, Blocos Decorativos, Pisos Drenantes e Guias.
  - Tente baixar as imagens oficiais (URLs no JSON).
  - Os PNGs de piso drenante e de telha por cor provavelmente já vêm com fundo transparente.
  - Se a imagem tiver fundo, **não recorte automaticamente de forma tosca**: use `PendingProduct`, uma silhueta técnica desenhada em SVG de linha fina com o rótulo mono "foto em produção".
- **`fabrica-aerea.jpg`:** tem só 550 px. Use-a assim mesmo, com zoom máximo 2×, e deixe uma constante `AERIAL_SRC` fácil de trocar pela versão em alta.
- **Fotos de obra:** as legendas ficam genéricas até confirmação.
- **Relatório final:** liste no README tudo que ficou com placeholder.

---

## 10. Processo de trabalho (siga nesta ordem)

1. **Plano curto antes do código:** árvore de componentes, lista de ScrollTriggers (seção, trigger, pin, end), riscos e como vai testar. Depois prossiga.
2. **Conteúdo e assets:**
   - crie `content/tatu.ts` tipado a partir do JSON;
   - otimize as imagens do kit;
   - tente baixar as imagens oficiais listadas.
3. **Layout estático completo**, sem nenhuma animação, em 1440, 1024, 768 e 390 px. A página precisa ser bonita e legível parada, porque é o que o modo reduced-motion vai mostrar.
4. **Animações, uma seção por vez**, na ordem Abertura → Produtos → Da peça à obra → História → Fábrica → Qualidade → Contato. Teste cada uma antes de seguir: rolagem para frente e para trás, rolagem rápida, resize no meio do pin.
5. **Transições entre seções:** o Flip do "1977", o retorno do bloco no fim da História e a cortina da obra.
6. **Timelines de mobile/tablet** e **reduced-motion**.
7. **QA** (seção 11) e correções.
8. **Entrega** (seção 12).

---

## 11. Checklist de QA — só entregue com tudo marcado

- [ ] `npm run build` sem erros nem warnings de TypeScript.
- [ ] Console limpo (zero erros/avisos) em Chrome, Safari e Firefox.
- [ ] Screenshots automatizados (Playwright) em 1440×900, 1024×768 e 390×844, nas posições 0%, 10%, 20% … 100% da página. Revise cada imagem: nada cortado, sobreposto sem intenção ou fora da grade.
- [ ] Rolar para trás desfaz cada animação perfeitamente (scrub reversível) e não sobra elemento "preso".
- [ ] Resize de 1440 → 390 → 1440 no meio de um pin não quebra o layout.
- [ ] `prefers-reduced-motion: reduce` emulado: página completa, legível, sem pins.
- [ ] Nenhuma imagem quebrada (verifique `naturalWidth > 0` de todas).
- [ ] Todos os links funcionam: `tel:`, `wa.me` (com texto), `mailto:`, PDFs, redes, loja e âncoras da nav.
- [ ] Sem overflow horizontal em 360 px.
- [ ] Lighthouse mobile ≥ 90 em Performance, Acessibilidade, Boas práticas e SEO.
- [ ] Todo número e data visível no site confere com `tatu-content.json` (faça uma checagem automatizada: extraia os números do DOM e compare).
- [ ] Teclado: Tab percorre nav → CTAs → produtos → formulário; modais abrem e fecham com teclado.

---

## 12. Entrega

1. **Projeto rodando:** `npm install && npm run dev`; `npm run build && npm run preview` para produção.
2. **README** com:
   - como trocar a cor de destaque;
   - como trocar a foto aérea;
   - como adicionar novos recortes/obras;
   - mapa das seções e dos ScrollTriggers;
   - lista de placeholders pendentes.
3. **Pasta `qa/`** com os screenshots e o relatório do Lighthouse.
4. **Resumo final:** o que foi feito, o que ficou pendente e por quê.

**Prioridade quando houver conflito:**
1. qualidade visual
2. experiência de scroll
3. transições entre seções
4. fidelidade aos materiais oficiais
5. performance
6. responsividade

**Fidelidade aos fatos nunca é negociável.**
