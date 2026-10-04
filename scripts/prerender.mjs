// Injeta o HTML pré-renderizado (dist-ssr/entry-server.js) em dist/index.html.
import { readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = path.resolve(import.meta.dirname, '..')
const { render } = await import(pathToFileURL(path.join(root, 'dist-ssr/entry-server.js')).href)
const file = path.join(root, 'dist/index.html')
const html = await readFile(file, 'utf8')
const out = html.replace('<div id="root"></div>', `<div id="root">${render()}</div>`)
if (out === html) throw new Error('marcador <div id="root"></div> não encontrado')
await writeFile(file, out)
await rm(path.join(root, 'dist-ssr'), { recursive: true, force: true })
console.log('prerender: index.html com HTML estático')
