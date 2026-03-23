#!/usr/bin/env node
/**
 * Checks that en.json and ar.json have the same set of translation keys.
 * Run: node scripts/check-i18n-parity.mjs
 */
import { readFileSync } from 'fs'
import { join } from 'path'

const MESSAGES_DIR = join(process.cwd(), 'messages')

function flattenKeys(obj, prefix = '') {
  const keys = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

const en = JSON.parse(readFileSync(join(MESSAGES_DIR, 'en.json'), 'utf8'))
const ar = JSON.parse(readFileSync(join(MESSAGES_DIR, 'ar.json'), 'utf8'))

const enKeys = new Set(flattenKeys(en))
const arKeys = new Set(flattenKeys(ar))

const missingInAr = [...enKeys].filter((k) => !arKeys.has(k))
const missingInEn = [...arKeys].filter((k) => !enKeys.has(k))

let exitCode = 0

if (missingInAr.length > 0) {
  console.error(`Missing in ar.json (${missingInAr.length} keys):`)
  missingInAr.forEach((k) => console.error(`  - ${k}`))
  exitCode = 1
}

if (missingInEn.length > 0) {
  console.error(`Missing in en.json (${missingInEn.length} keys):`)
  missingInEn.forEach((k) => console.error(`  - ${k}`))
  exitCode = 1
}

if (exitCode === 0) {
  console.log(`i18n parity check passed: ${enKeys.size} keys in both en.json and ar.json`)
} else {
  console.error(`\ni18n parity check FAILED`)
}

process.exit(exitCode)
