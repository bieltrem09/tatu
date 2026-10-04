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

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'public/img/kit')
const MANIFEST = path.join(ROOT, 'src/content/assets.gen.json')
const SOURCES = [
  { dir: 'assets/recortes', kind: 'cutout', widths: [400, 640, 1000] },
  { dir: 'assets/fotos', kind: 'photo', widths: [640, 1280, 1920] },
]
const EXT = /\.(png|webp|jpe?g)$/i

await mkdir(OUT, { recursive: true })
const prev = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {}
const manifest = {}

for (const src of SOURCES) {
  const dir = path.join(ROOT, src.dir)
  if (!existsSync(dir)) continue
  for (const file of (await readdir(dir)).sort()) {
    if (!EXT.test(file)) continue
    const name = file.replace(EXT, '')
    const input = path.join(dir, file)
    const mtime = (await stat(input)).mtimeMs
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
        await base.clone().webp({ quality: src.kind === 'cutout' ? 86 : 80, alphaQuality: 90 }).toFile(path.join(OUT, `${name}-${w}.webp`))
        if (src.kind === 'photo') await base.clone().avif({ quality: 55 }).toFile(path.join(OUT, `${name}-${w}.avif`))
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
