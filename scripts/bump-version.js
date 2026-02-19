#!/usr/bin/env node
/**
 * Erhöht die Version in version.yaml und package.json
 *
 * Verwendung:
 *   node scripts/bump-version.js patch  # 1.3.0 -> 1.3.1
 *   node scripts/bump-version.js minor  # 1.3.0 -> 1.4.0
 *   node scripts/bump-version.js major  # 1.3.0 -> 2.0.0
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

// Lese aktuelle Version aus version.yaml
const versionYamlPath = join(rootDir, 'version.yaml')
const versionYaml = readFileSync(versionYamlPath, 'utf-8')
const currentVersion = versionYaml.match(/version:\s*(.+)/)?.[1]?.trim()

if (!currentVersion) {
  console.error('❌ Konnte Version nicht aus version.yaml lesen')
  process.exit(1)
}

// Bestimme Bump-Typ (Standard: patch)
const bumpType = process.argv[2] || 'patch'
const newVersion = bumpVersion(currentVersion, bumpType)

// Aktualisiere version.yaml
const newVersionYaml = `version: ${newVersion}\n`
writeFileSync(versionYamlPath, newVersionYaml, 'utf-8')
console.log(`✅ version.yaml: ${currentVersion} -> ${newVersion}`)

// Aktualisiere package.json
const packageJsonPath = join(rootDir, 'package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
packageJson.version = newVersion
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf-8')
console.log(`✅ package.json: ${currentVersion} -> ${newVersion}`)

console.log(`\n🎉 Version erfolgreich erhöht auf ${newVersion}`)
