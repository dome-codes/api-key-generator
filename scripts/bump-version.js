#!/usr/bin/env node
/**
 * Erhöht die Version in version.yml und package.json
 *
 * Verwendung:
 *   node scripts/bump-version.js patch  # APIKEY_MANAGEMENT: 1.3.0 -> 1.3.1
 *   node scripts/bump-version.js minor  # APIKEY_MANAGEMENT: 1.3.0 -> 1.4.0
 *   node scripts/bump-version.js major  # APIKEY_MANAGEMENT: 1.3.0 -> 2.0.0
 *
 * Aktualisiert nur APIKEY_MANAGEMENT, MIDDLEWARE bleibt unverändert
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

function bumpVersion(currentVersion, type) {
  const [major, minor, patch] = currentVersion.split('.').map(Number)

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    default:
      throw new Error(`Unbekannter Version-Typ: ${type}. Verwende: patch, minor oder major`)
  }
}

// Lese aktuelle Version aus version.yml
const versionYmlPath = join(rootDir, 'version.yml')
const versionYml = readFileSync(versionYmlPath, 'utf-8')

// Extrahiere APIKEY_MANAGEMENT Version
const apiKeyManagementMatch = versionYml.match(/APIKEY_MANAGEMENT:\s*(.+)/)
const currentVersion = apiKeyManagementMatch?.[1]?.trim()

if (!currentVersion) {
  console.error('❌ Konnte APIKEY_MANAGEMENT Version nicht aus version.yml lesen')
  process.exit(1)
}

// Bestimme Bump-Typ (Standard: patch)
const bumpType = process.argv[2] || 'patch'
const newVersion = bumpVersion(currentVersion, bumpType)

// Aktualisiere version.yml - behalte MIDDLEWARE unverändert
const middlewareMatch = versionYml.match(/MIDDLEWARE:\s*(.+)/)
const middlewareVersion = middlewareMatch?.[1]?.trim() || '2.10.22'

const newVersionYml = `APIKEY_MANAGEMENT: ${newVersion}
MIDDLEWARE: ${middlewareVersion}
`
writeFileSync(versionYmlPath, newVersionYml, 'utf-8')
console.log(`✅ version.yml: APIKEY_MANAGEMENT ${currentVersion} -> ${newVersion}`)
if (middlewareVersion) {
  console.log(`   MIDDLEWARE: ${middlewareVersion} (unverändert)`)
}

// Aktualisiere package.json
const packageJsonPath = join(rootDir, 'package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
packageJson.version = newVersion
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf-8')
console.log(`✅ package.json: ${currentVersion} -> ${newVersion}`)

console.log(`\n🎉 Version erfolgreich erhöht auf ${newVersion}`)
