// QA automatizado: imagens, links, overflow, fatos x JSON, console, screenshots.
// Uso: npm run build && npm run preview (porta 4173) e, em outro terminal: npm run qa
import { chromium } from '@playwright/test'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const URL = process.env.URL ?? 'http://localhost:4173/'
const exe = existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}
const browser = await chromium.launch(exe)
const report = []
const ok = (name, pass, detail = '') => report.push({ name, pass, detail })
const json = readFileSync('content/tatu-content.json', 'utf8')

async function open(w, h, reduced = false) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  const logs = []
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && logs.push(m.text()))
  page.on('pageerror', (e) => logs.push(e.message))
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  return { page, logs }
}
async function scrollAll(page) {
  const H = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y <= H; y += 500) {
    await page.evaluate((y) => scrollTo(0, y), y)
    await page.waitForTimeout(80)
  }
  await page.waitForTimeout(1200)
}

// 1. Desktop: console, imagens, links
{
  const { page, logs } = await open(1440, 900)
  await scrollAll(page)
  const imgs = await page.evaluate(() => [...document.images].map((i) => ({ src: i.currentSrc || i.src, w: i.naturalWidth, lazy: i.loading })))
  const broken = imgs.filter((i) => i.w === 0 && !i.src.includes('ytimg'))
  ok('Nenhuma imagem quebrada (naturalWidth > 0)', broken.length === 0, broken.map((b) => b.src).join(', ') || `${imgs.length} imagens`)
  ok('Console limpo (1440, scroll completo)', logs.length === 0, logs.slice(0, 5).join(' | '))

  const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')))
  const anchors = links.filter((h) => h.startsWith('#'))
  const missing = await page.evaluate((ids) => ids.filter((h) => !document.getElementById(h.slice(1))), anchors)
  ok('Âncoras internas existem', missing.length === 0, missing.join(', ') || `${anchors.length} âncoras`)
  const wa = links.filter((h) => h.startsWith('https://wa.me/'))
  ok('Links wa.me presentes e com número do JSON', wa.length > 0 && wa.every((h) => h.includes('5519998098949')), `${wa.length} links`)
  ok('wa.me com texto (orçamento)', wa.some((h) => h.includes('?text=')), '')
  const tel = links.filter((h) => h.startsWith('tel:'))
  ok('tel: só aparece quando o JSON tem telefone', tel.length === 0 || json.includes('"telefone": "'), `${tel.length} links tel:`)

  // Formulário: validação inline e mensagem para o WhatsApp
  await page.evaluate(() => document.getElementById('orcamento').scrollIntoView())
  await page.click('#orcamento button[type=submit]')
  const errs = await page.locator('.field__error').count()
  ok('Formulário valida inline', errs === 4, `${errs} erros exibidos`)
  await page.fill('#f-nome', 'Teste QA')
  await page.fill('#f-contato', 'qa@example.com')
  await page.selectOption('#f-produto', { index: 1 })
  await page.fill('#f-mensagem', 'Mensagem de teste do QA')
  await page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(String(u)); return null } })
  await page.click('#orcamento button[type=submit]')
  const popupUrl = (await page.evaluate(() => window.__opened[0])) ?? ''
  ok('Envio abre WhatsApp com a mensagem montada', /^https:\/\/wa\.me\/5519998098949\?text=/.test(popupUrl) && popupUrl.includes('Teste%20QA'), popupUrl.slice(0, 90))

  // Números visíveis x JSON
  const text = await page.evaluate(() => document.body.innerText)
  const nums = [...new Set(text.match(/\b\d{1,3}(?:\.\d{3})+\b|\b(?:19|20)\d{2}\b|\+\d+%/g) ?? [])]
  const notInJson = nums.filter((n) => !json.includes(n) && !json.includes(n.replace(/\./g, '')) && n !== String(new Date().getFullYear()))
  ok('Todo número/data visível existe no tatu-content.json', notInJson.length === 0, notInJson.join(', ') || `${nums.length} números conferidos`)

  // Teclado: modal de produto abre/fecha e devolve o foco
  const btn = page.locator('.prod__line-btn').first()
  await btn.focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(150)
  const dlg = await page.locator('[role=dialog]').count()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(150)
  const after = await page.locator('[role=dialog]').count()
  const focusBack = await page.evaluate(() => document.activeElement?.classList.contains('prod__line-btn'))
  ok('Drawer abre com Enter, fecha com Esc e devolve o foco', dlg === 1 && after === 0 && focusBack, `${dlg}/${after}/${focusBack}`)
  await page.close()
}

// 2. Overflow horizontal em 360 px e 390 px
for (const w of [360, 390]) {
  const { page, logs } = await open(w, 800)
  await scrollAll(page)
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  ok(`Sem overflow horizontal em ${w}px`, over <= 0, `${over}px`)
  ok(`Console limpo (${w})`, logs.length === 0, logs.slice(0, 3).join(' | '))
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('a, button, input, select, textarea')]
      .filter((e) => e.offsetParent && !e.closest('.sr-only, .skip-link'))
      .map((e) => [e, e.getBoundingClientRect()])
      .filter(([, r]) => r.width > 0 && (Math.round(r.height) < 44 || Math.round(r.width) < 44))
      .map(([e, r]) => `${e.tagName.toLowerCase()}.${e.className.split(' ')[0]} ${Math.round(r.width)}×${Math.round(r.height)}`),
  )
  ok(`Áreas de toque ≥ 44px (${w})`, small.length === 0, small.slice(0, 6).join(', '))
  await page.close()
}

// 3. Reduced motion: sem pins
{
  const { page } = await open(1440, 900, true)
  const pins = await page.evaluate(() => document.querySelectorAll('.pin-spacer').length)
  ok('Reduced motion: nenhum pin', pins === 0, `${pins} pin-spacers`)
  await page.close()
}

// 4. Resize no meio de um pin: 1440 → 390 → 1440
{
  const { page, logs } = await open(1440, 900)
  await page.evaluate(() => scrollTo(0, document.getElementById('produtos').getBoundingClientRect().top + scrollY + 900))
  await page.waitForTimeout(800)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(1200)
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.waitForTimeout(1200)
  await page.evaluate(() => scrollTo(0, 0))
  await page.waitForTimeout(1500)
  const heroVisible = await page.evaluate(() => getComputedStyle(document.querySelector('.ab__stage')).visibility !== 'hidden')
  ok('Resize 1440→390→1440 no meio do pin', over <= 0 && heroVisible && logs.length === 0, `overflow ${over}px, hero ${heroVisible}, logs ${logs.length}`)
  await page.close()
}

await browser.close()
mkdirSync('qa', { recursive: true })
const md = ['# Relatório de QA automatizado', '', `Gerado em ${new Date().toISOString()}`, '', '| Verificação | Resultado | Detalhe |', '|---|---|---|', ...report.map((r) => `| ${r.name} | ${r.pass ? 'OK' : 'FALHOU'} | ${String(r.detail).replace(/\|/g, '/')} |`)].join('\n')
writeFileSync('qa/qa-report.md', md + '\n')
console.log(md)
process.exitCode = report.every((r) => r.pass) ? 0 : 1
