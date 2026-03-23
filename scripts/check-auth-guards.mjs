#!/usr/bin/env node
/**
 * Static analysis: Ensures every server action file and API route has auth guards.
 * Run: node scripts/check-auth-guards.mjs
 */
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const SRC = join(process.cwd(), 'src')

// Files that legitimately don't need auth guards (e.g., login actions)
const ALLOWED_NO_GUARD = [
  'src/app/login/actions.ts',
]

const GUARD_PATTERNS = [
  'requireAdmin',
  'requireStaff',
  'requireParent',
  'requireAuth',
  'requireAdminApiUser',
  'requireStaffApiUser',
  'getCurrentUserProfile',
  'getUser',
]

function walk(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      results.push(...walk(full))
    } else if (/\.(ts|tsx)$/.test(entry)) {
      results.push(full)
    }
  }
  return results
}

let failures = 0

// Check server actions (files with 'use server')
const actionFiles = walk(join(SRC, 'app')).filter((f) => {
  const content = readFileSync(f, 'utf8')
  return content.includes("'use server'") || content.includes('"use server"')
})

for (const file of actionFiles) {
  const rel = relative(process.cwd(), file)
  if (ALLOWED_NO_GUARD.includes(rel)) continue
  const content = readFileSync(file, 'utf8')
  const hasGuard = GUARD_PATTERNS.some((p) => content.includes(p))
  if (!hasGuard) {
    console.error(`FAIL: ${rel} has 'use server' but no auth guard`)
    failures++
  }
}

// Check API routes (route.ts files with POST/PUT/DELETE/PATCH)
const apiRoutes = walk(join(SRC, 'app', 'api')).filter((f) => f.endsWith('route.ts'))

for (const file of apiRoutes) {
  const content = readFileSync(file, 'utf8')
  const hasMutation = /export\s+async\s+function\s+(POST|PUT|DELETE|PATCH)/.test(content)
  if (hasMutation) {
    const hasGuard = GUARD_PATTERNS.some((p) => content.includes(p))
    if (!hasGuard) {
      const rel = relative(process.cwd(), file)
      console.error(`FAIL: ${rel} has mutating endpoint but no auth guard`)
      failures++
    }
    // Check CSRF
    if (!content.includes('validateCsrf')) {
      const rel = relative(process.cwd(), file)
      console.warn(`WARN: ${rel} has mutating endpoint but no CSRF validation`)
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} file(s) missing auth guards`)
  process.exit(1)
} else {
  console.log(`All ${actionFiles.length} server actions and ${apiRoutes.length} API routes have auth guards`)
}
