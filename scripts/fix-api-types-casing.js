/**
 * Korrigiert Import-/Export-Pfade in src/api/types (ai → aI) für case-sensitive Dateisysteme (Linux).
 * Nach Orval in CI ausführen: pnpm run api:generate
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const typesDir = path.join(__dirname, '..', 'src', 'api', 'types')

const REPLACEMENTS = [
  ['./aiUsagePage', './aIUsagePage'],
  ['./aiUsageRecord', './aIUsageRecord'],
  ['./aiUsageSummaryPage', './aIUsageSummaryPage'],
  ['./aiUsageSummaryRecord', './aIUsageSummaryRecord'],
  ['./aiRequestParamsGroupByParameter', './aIRequestParamsGroupByParameter'],
  ['./aiRequestParamsGroupByParameterItem', './aIRequestParamsGroupByParameterItem'],
  ['./aiRequestParamsModelParameter', './aIRequestParamsModelParameter'],
  ['./aiRequestParamsModelTypeParameter', './aIRequestParamsModelTypeParameter'],
  ['./aiRequestParamsUsageTypeParameter', './aIRequestParamsUsageTypeParameter'],
]

function fix(content) {
  let out = content
  for (const [from, to] of REPLACEMENTS) {
    if (out.includes(from)) out = out.split(from).join(to)
  }
  return out
}

function dedupeIndex(content) {
  const seen = new Set()
  return content
    .split('\n')
    .map((line) => {
      const m = line.match(/export\s+\*\s+from\s+['"]([^'"]+)['"]/)
      if (!m) return line
      const rawPath = m[1]
      const normalizedPath = fix(rawPath)
      if (seen.has(normalizedPath)) return null
      seen.add(normalizedPath)
      return line.replace(rawPath, normalizedPath)
    })
    .filter((l) => l != null)
    .join('\n')
}

if (!existsSync(typesDir)) {
  process.exit(0)
}

for (const name of readdirSync(typesDir)) {
  if (!name.endsWith('.ts')) continue
  const filePath = path.join(typesDir, name)
  let content = readFileSync(filePath, 'utf8')
  const isIndex = name === 'index.ts'
  const next = isIndex ? dedupeIndex(fix(content)) : fix(content)
  if (next !== content) {
    writeFileSync(filePath, next, 'utf8')
    console.log('Fixed:', path.relative(process.cwd(), filePath))
  }
}
