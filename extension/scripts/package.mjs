// Builds a store-ready zip: node scripts/package.mjs  →  dist/offerflow-extension-<version>.zip
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'

const { version } = JSON.parse(readFileSync('manifest.json', 'utf8'))
const out = `dist/offerflow-extension-${version}.zip`
mkdirSync('dist', { recursive: true })
rmSync(out, { force: true })
execFileSync('zip', ['-r', '-q', out, 'manifest.json', 'src', 'popup', 'options', 'icons'], { stdio: 'inherit' })
console.log(`Wrote ${out}`)
