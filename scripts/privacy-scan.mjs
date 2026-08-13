import { readdir, readFile } from 'node:fs/promises'
import { extname, relative, resolve } from 'node:path'

import { scanText } from './privacy-scan-core.mjs'

const root = resolve(process.cwd())
const ignoredDirectories = new Set(['.git', '.next', 'node_modules', 'coverage', 'out', 'build'])
const textExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.md', '.sql', '.toml', '.css', '.yml', '.yaml', '.txt', '.example'])

async function collect(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collect(path))
    else if (entry.name.startsWith('.env') || textExtensions.has(extname(entry.name)) || entry.name === 'README') files.push(path)
  }
  return files
}

const findings = []
for (const file of await collect(root)) {
  const display = relative(root, file)
  findings.push(...scanText(display, await readFile(file, 'utf8')))
}

if (findings.length) {
  console.error('Privacy scan failed:')
  for (const finding of findings) console.error(`${finding.file}:${finding.line} [${finding.rule}] ${finding.sample}`)
  process.exitCode = 1
} else {
  console.log(`Privacy scan passed across ${(await collect(root)).length} text files.`)
}
