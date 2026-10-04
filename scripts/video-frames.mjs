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

const key = `${statSync(SRC).mtimeMs}|${JSON.stringify(cfg.trechos)}|${N}`
const prev = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}
const done = (d) => existsSync(path.join(OUT, d)) && readdirSync(path.join(OUT, d)).length === N
if (prev.key === key && Object.keys(SIZES).every(done)) process.exit(0)

const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', SRC]).toString())
const v = probe.streams.find((s) => s.codec_type === 'video')
const dur = Number(probe.format.duration)
// trechos [[inicio, fim], ...] em segundos; sem trechos = vídeo inteiro
const segs = (cfg.trechos?.length ? cfg.trechos : [[0, dur]]).map(([a, b]) => [Math.max(0, a), Math.min(dur, b)]).filter(([a, b]) => b > a)
const total = segs.reduce((t, [a, b]) => t + b - a, 0)
// distribui os N quadros proporcionalmente à duração de cada trecho
const counts = segs.map(([a, b]) => Math.round((N * (b - a)) / total))
counts[counts.length - 1] += N - counts.reduce((x, y) => x + y, 0)
for (const [dir, w] of Object.entries(SIZES)) {
  rmSync(path.join(OUT, dir), { recursive: true, force: true })
  mkdirSync(path.join(OUT, dir), { recursive: true })
  let offset = 1
  segs.forEach(([a, b], k) => {
    const n = counts[k]
    execFileSync('ffmpeg', ['-v', 'error', '-ss', String(a), '-to', String(b), '-i', SRC, '-vf', `fps=${n / (b - a)},scale=${w}:-2`, '-frames:v', String(n), '-start_number', String(offset), '-c:v', 'libwebp', '-quality', dir === 'd' ? '62' : '58', path.join(OUT, dir, 'f%03d.webp')])
    offset += n
  })
}
const count = readdirSync(path.join(OUT, 'd')).length
write({ key, count, segments: segs, counts, ratio: v.width / v.height })
console.log(`video: ${count} quadros de ${segs.map(([a, b]) => `${a}s–${b}s`).join(' + ')}`)
