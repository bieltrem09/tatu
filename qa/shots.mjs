// Uso: node qa/shots.mjs <width> <height> <steps> [outdir] [reduced]
import { chromium } from '@playwright/test'
import { existsSync, mkdirSync } from 'node:fs'
const [w = 1440, h = 900, steps = 20, out = 'qa/tmp', reduced] = process.argv.slice(2)
const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1200/chrome-linux/chrome'].find((p) => existsSync(p))
const browser = await chromium.launch(exe ? { executablePath: exe } : {})
const page = await browser.newPage({ viewport: { width: +w, height: +h }, reducedMotion: reduced ? 'reduce' : 'no-preference' })
const logs = []
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && logs.push(`${m.type()}: ${m.text()}`))
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`))
await page.goto(process.env.URL ?? 'http://localhost:4173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2200)
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
mkdirSync(out, { recursive: true })
for (let i = 0; i <= +steps; i++) {
  const y = Math.round((total * i) / +steps)
  await page.evaluate((y) => window.scrollTo(0, y), y)
  await page.waitForTimeout(1400)
  const pct = String(Math.round((i / +steps) * 100)).padStart(3, '0')
  await page.screenshot(process.env.JPEG ? { path: `${out}/${w}x${h}-${pct}.jpg`, type: 'jpeg', quality: 72 } : { path: `${out}/${w}x${h}-${String(i).padStart(3, '0')}.png` })
}
console.log('scrollHeight', total, '\n' + logs.join('\n'))
await browser.close()
