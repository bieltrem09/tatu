// Gera AVIF + WebP em até 3 larguras para cada arquivo do kit e escreve o manifesto
// src/content/assets.gen.json. Arquivos ausentes simplesmente não entram no manifesto:
// o site renderiza PendingProduct / PendingPhoto no lugar.
//
//   assets/recortes/<nome>.(png|webp)   → peças com fundo transparente
//   assets/fotos/<nome>.(jpg|jpeg|png|webp)
//
// Uso: npm run assets  (roda automaticamente antes de dev e build)
import { readdir, mkdir, stat, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { createHash } from 'node:crypto'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'public/img/kit')
const MANIFEST = path.join(ROOT, 'src/content/assets.gen.json')
const SOURCES = [
  { dir: 'assets/recortes', kind: 'cutout', widths: [400, 640, 1000] },
  { dir: 'assets/recortes-cores', kind: 'cutout', widths: [400, 640, 1000] },
  { dir: 'assets/fotos', kind: 'photo', widths: [640, 1280, 2048] },
]
const EXT = /\.(png|webp|jpe?g)$/i

await mkdir(OUT, { recursive: true })

// Variações de cor da telha: a foto real (cinza natural) recolorida pixel a pixel, preservando a
// textura e o sombreamento. A cor de cada variação é a amostra oficial do tatu-content.json.
const TINT_DIR = path.join(ROOT, 'assets/recortes-cores')
{
  const content = JSON.parse(await readFile(path.join(ROOT, 'content/tatu-content.json'), 'utf8'))
  const telha = content.produtos.find((p) => p.cores)
  const srcFile = telha && ['webp', 'png'].map((e) => path.join(ROOT, `assets/recortes/${telha.recorte}.${e}`)).find(existsSync)
  if (srcFile) {
    await mkdir(TINT_DIR, { recursive: true })
    const srcHash = createHash('sha1').update(await readFile(srcFile)).digest('hex').slice(0, 10)
    const { data, info } = await sharp(srcFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    // luminância média da peça (só pixels opacos)
    let sum = 0, n = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 200) continue
      sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
      n++
    }
    const mean = sum / Math.max(1, n)
    for (const cor of telha.cores) {
      const out = path.join(TINT_DIR, `${cor.recorte}.webp`)
      const tag = path.join(TINT_DIR, `.${cor.recorte}.${srcHash}.${cor.amostra.slice(1)}`)
      if (existsSync(out) && existsSync(tag)) continue
      const hex = cor.amostra.replace('#', '')
      const c = [0, 2, 4].map((k) => parseInt(hex.slice(k, k + 2), 16))
      const buf = Buffer.from(data)
      for (let i = 0; i < buf.length; i += 4) {
        const l = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / mean
        for (let k = 0; k < 3; k++) {
          // multiplica pela razão de luminância; acima de 1 clareia em direção ao branco sem estourar
          const v = l <= 1 ? c[k] * l : c[k] + (255 - c[k]) * (1 - 1 / l) * 0.6
          buf[i + k] = Math.max(0, Math.min(255, Math.round(v)))
        }
      }
      await sharp(buf, { raw: info }).webp({ lossless: true }).toFile(out)
      for (const f of await readdir(TINT_DIR)) if (f.startsWith(`.${cor.recorte}.`)) await import('node:fs/promises').then((m) => m.unlink(path.join(TINT_DIR, f)))
      await writeFile(tag, '')
      console.log(`  ✓ cor ${cor.recorte}`)
    }
  }
}
const prev = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {}
const manifest = {}

for (const src of SOURCES) {
  const dir = path.join(ROOT, src.dir)
  if (!existsSync(dir)) continue
  for (const file of (await readdir(dir)).sort()) {
    if (!EXT.test(file)) continue
    const name = file.replace(EXT, '')
    const input = path.join(dir, file)
    // hash do conteúdo (não a data): um clone novo reaproveita as imagens já versionadas
    const mtime = createHash('sha1').update(await readFile(input)).digest('hex')
    const meta = await sharp(input).metadata()
    const widths = [...new Set(src.widths.map((w) => Math.min(w, meta.width)))]
    const entry = {
      kind: src.kind,
      width: meta.width,
      height: meta.height,
      widths,
      mtime,
    }
    const cached = prev[name]
    const fresh =
      cached && cached.mtime === mtime &&
      widths.every((w) => existsSync(path.join(OUT, `${name}-${w}.webp`)) && (src.kind !== 'photo' || existsSync(path.join(OUT, `${name}-${w}.avif`))))
    if (!fresh) {
      for (const w of widths) {
        const base = sharp(input).resize({ width: w, withoutEnlargement: true })
        await base.clone().webp({ quality: src.kind === 'cutout' ? 88 : 84, alphaQuality: 92, smartSubsample: true, effort: 5 }).toFile(path.join(OUT, `${name}-${w}.webp`))
        if (src.kind === 'photo') await base.clone().avif({ quality: 62, effort: 5 }).toFile(path.join(OUT, `${name}-${w}.avif`))
      }
      console.log(`  ✓ ${name} (${widths.join(', ')})`)
    }
    manifest[name] = entry
  }
}

// Open Graph: a peça do hero sobre o fundo do estúdio
if (manifest.blocos) {
  const og = path.join(ROOT, 'public/og.jpg')
  if (!existsSync(og) || !prev.blocos || prev.blocos.mtime !== manifest.blocos.mtime) {
    const piece = await sharp(path.join(OUT, `blocos-${manifest.blocos.widths.at(-1)}.webp`)).resize({ width: 760 }).toBuffer()
    await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#F0EDE7' } })
      .composite([{ input: piece, gravity: 'center' }])
      .jpeg({ quality: 82 })
      .toFile(og)
  }
}

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
console.log(`assets: ${Object.keys(manifest).length} arquivos no manifesto`)
