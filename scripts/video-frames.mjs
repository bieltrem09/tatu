// Extrai uma sequência de quadros do vídeo institucional para a animação de scroll (seção Produção).
//   assets/video/producao.mp4  → public/img/frames/{d,m}/fNNN.webp + src/content/frames.gen.json
// Se o mp4 não existir, tenta baixar com yt-dlp (precisa de acesso a youtube.com). Sem vídeo, a
// seção simplesmente não aparece (count: 0) e o build segue normalmente.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'assets/video/producao.mp4')
const OUT = path.join(ROOT, 'public/img/frames')
const MANIFEST = path.join(ROOT, 'src/content/frames.gen.json')
const cfg = JSON.parse(readFileSync(path.join(ROOT, 'content/tatu-content.json'), 'utf8')).producao ?? {}
const N = cfg.quadros ?? 144
const SIZES = { d: 1280, m: 720 }

const write = (m) => writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + '\n')

if (!existsSync(SRC) && cfg.youtube_id) {
  const has = spawnSync('yt-dlp', ['--version'], { stdio: 'ignore' }).status === 0
  if (has) {
    console.log('video: baixando', cfg.youtube_id)
    const r = spawnSync('yt-dlp', ['-q', '--retries', '0', '--extractor-retries', '0', '--socket-timeout', '10', '-f', 'bv*[height<=720][ext=mp4]/b[ext=mp4]/bv*[height<=720]', '--remux-video', 'mp4', '-o', SRC, `https://youtu.be/${cfg.youtube_id}`], { stdio: 'inherit' })
    if (r.status !== 0) console.log('video: download falhou (rede?) — seção Produção desligada')
  }
}
if (!existsSync(SRC)) {
  write({ count: 0 })
  console.log('video: assets/video/producao.mp4 ausente — seção Produção desligada')
  process.exit(0)
}

const key = `${statSync(SRC).mtimeMs}|${cfg.inicio}|${cfg.fim}|${N}`
const prev = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}
const done = (d) => existsSync(path.join(OUT, d)) && readdirSync(path.join(OUT, d)).length === N
if (prev.key === key && Object.keys(SIZES).every(done)) process.exit(0)

const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', SRC]).toString())
const v = probe.streams.find((s) => s.codec_type === 'video')
const dur = Number(probe.format.duration)
const start = Math.max(0, cfg.inicio ?? 0)
const end = Math.min(dur, cfg.fim ?? dur)
const fps = N / (end - start)
for (const [dir, w] of Object.entries(SIZES)) {
  rmSync(path.join(OUT, dir), { recursive: true, force: true })
  mkdirSync(path.join(OUT, dir), { recursive: true })
  execFileSync('ffmpeg', ['-v', 'error', '-ss', String(start), '-to', String(end), '-i', SRC, '-vf', `fps=${fps},scale=${w}:-2`, '-frames:v', String(N), '-c:v', 'libwebp', '-quality', dir === 'd' ? '62' : '58', path.join(OUT, dir, 'f%03d.webp')])
}
const count = readdirSync(path.join(OUT, 'd')).length
const ratio = v.width / v.height
write({ key, count, start, end, ratio })
console.log(`video: ${count} quadros (${start.toFixed(1)}s–${end.toFixed(1)}s)`)
