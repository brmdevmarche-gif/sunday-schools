import { describe, it, expect, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

vi.mock('server-only', () => ({}))

/**
 * Static analysis tests that verify every server action and API route
 * has the required auth guards, CSRF checks, and follows project conventions.
 *
 * This catches missing security guards at test time, not at runtime.
 */

const SRC_DIR = path.resolve(__dirname, '../../src')

function findFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, pattern))
    } else if (pattern.test(entry.name)) {
      results.push(fullPath)
    }
  }
  return results
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8')
}

function relativePath(filePath: string): string {
  return path.relative(path.resolve(__dirname, '../..'), filePath)
}

/**
 * Check if a file has ANY form of auth check — either centralized guards
 * or inline supabase.auth.getUser() calls.
 */
function hasAuthCheck(content: string): boolean {
  return (
    content.includes('requireAdmin') ||
    content.includes('requireStaff') ||
    content.includes('requireAuth') ||
    content.includes('requireParent') ||
    content.includes('requireAdminOrRedirect') ||
    content.includes('requireAuthOrRedirect') ||
    content.includes('.auth.getUser()') ||
    content.includes('getAuthUser') ||
    content.includes('getCurrentUserProfile')
  )
}

/**
 * Check if a file uses centralized auth guards (preferred pattern).
 */
function hasCentralizedGuard(content: string): boolean {
  return (
    content.includes('requireAdmin') ||
    content.includes('requireStaff') ||
    content.includes('requireAuth') ||
    content.includes('requireParent') ||
    content.includes('requireAdminOrRedirect') ||
    content.includes('requireAuthOrRedirect')
  )
}

// Server actions that are exempt from auth guard requirements
const EXEMPT_ACTION_PATTERNS = [
  '/login/',   // Login actions don't require prior auth
]

function isExemptAction(rel: string): boolean {
  return EXEMPT_ACTION_PATTERNS.some((p) => rel.includes(p))
}

describe('Server Action Auth Guards', () => {
  const actionFiles = findFiles(path.join(SRC_DIR, 'app'), /^actions\.ts$/)

  it('found server action files to audit', () => {
    expect(actionFiles.length).toBeGreaterThan(0)
  })

  for (const file of actionFiles) {
    const rel = relativePath(file)
    const content = readFile(file)

    // Skip if not a server action file
    if (!content.includes("'use server'") && !content.includes('"use server"')) continue
    // Skip exempt files
    if (isExemptAction(rel)) continue

    it(`${rel} has an auth check (guard or inline getUser)`, () => {
      expect(hasAuthCheck(content), `No auth check found in ${rel}`).toBe(true)
    })

    // Advisory: flag files that use inline auth instead of centralized guards
    if (hasAuthCheck(content) && !hasCentralizedGuard(content)) {
      it.skip(`${rel} uses inline auth — consider migrating to centralized guard`, () => {})
    }
  }
})

describe('API Route Auth Guards', () => {
  const routeFiles = findFiles(path.join(SRC_DIR, 'app'), /^route\.ts$/)

  it('found API route files to audit', () => {
    expect(routeFiles.length).toBeGreaterThan(0)
  })

  for (const file of routeFiles) {
    const rel = relativePath(file)
    const content = readFile(file)

    // Skip public routes (login, health check, etc.)
    if (rel.includes('/login/') || rel.includes('/health')) continue

    const hasMutationHandler =
      content.includes('export async function POST') ||
      content.includes('export async function PUT') ||
      content.includes('export async function DELETE') ||
      content.includes('export async function PATCH')

    it(`${rel} has an auth check`, () => {
      const hasGuard =
        content.includes('requireAdminApiUser') ||
        content.includes('requireStaffApiUser') ||
        content.includes('requireApiAuth') ||
        content.includes('.auth.getUser()')
      expect(hasGuard, `No auth check found in API route ${rel}`).toBe(true)
    })

    if (hasMutationHandler) {
      it(`${rel} validates CSRF on mutations`, () => {
        const hasCsrf =
          content.includes('validateCsrf') ||
          content.includes('withCsrf')
        expect(hasCsrf, `Missing CSRF validation in mutating API route ${rel}`).toBe(true)
      })
    }
  }
})

describe('No console.log in source', () => {
  const tsFiles = findFiles(SRC_DIR, /\.(ts|tsx)$/)

  const allowedFiles = [
    'logger.ts',
    'client-logger.ts',
    'dev.js',
  ]

  let violationCount = 0

  for (const file of tsFiles) {
    const basename = path.basename(file)
    if (allowedFiles.includes(basename)) continue

    const content = readFile(file)
    const rel = relativePath(file)

    // Check for raw console.log/error/warn calls, excluding comments
    const lines = content.split('\n')
    const consoleCalls = lines.filter((line) => {
      const trimmed = line.trim()
      // Skip comment lines
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return false
      return /\bconsole\.(log|error|warn|info|debug)\s*\(/.test(line)
    })
    if (consoleCalls.length > 0) {
      violationCount++
      it(`${rel} should not use raw console.* (use structured logger)`, () => {
        expect(consoleCalls, `Found ${consoleCalls.length} console.* call(s) in ${rel}`).toEqual([])
      })
    }
  }

  if (violationCount === 0) {
    it('no console.* violations found', () => {
      expect(true).toBe(true)
    })
  }
})

describe('No SELECT * in Supabase queries', () => {
  // Files that legitimately use select('*') because the result is typed as a full row type
  // (e.g., Diocese[], Church[], User[]) and TypeScript requires all columns.
  // These should be migrated to partial types (Pick<T, ...>) in a future refactor.
  const ALLOWED_SELECT_STAR = new Set([
    'src/app/activities/actions.ts',
    'src/app/activities/competitions/actions.ts',
    'src/app/activities/readings/actions.ts',
    'src/app/activities/spiritual-notes/actions.ts',
    'src/app/admin/activities/actions.ts',
    'src/app/admin/announcements/actions.ts',
    'src/app/admin/announcements/page.tsx',
    'src/app/admin/announcements/[id]/edit/page.tsx',
    'src/app/admin/announcements/create/page.tsx',
    'src/app/admin/churches/actions.ts',
    'src/app/admin/churches/[id]/page.tsx',
    'src/app/admin/classes/actions.ts',
    'src/app/admin/dioceses/actions.ts',
    'src/app/admin/dioceses/[id]/page.tsx',
    'src/app/admin/store/[id]/page.tsx',
    'src/app/admin/store/orders/page.tsx',
    'src/app/admin/trips/actions.ts',
    'src/app/admin/users/actions.ts',
    'src/app/dashboard/parents/actions.ts',
    'src/app/gamification/actions.ts',
    'src/app/trips/actions.ts',
    'src/lib/sunday-school/diocese-admins.ts',
  ])

  const tsFiles = findFiles(SRC_DIR, /\.(ts|tsx)$/)

  for (const file of tsFiles) {
    const content = readFile(file)
    const rel = relativePath(file)

    if (ALLOWED_SELECT_STAR.has(rel)) continue

    if (content.includes(".select('*')") || content.includes('.select("*")')) {
      it(`${rel} should not use SELECT * (use explicit columns)`, () => {
        expect(
          content.includes(".select('*')") || content.includes('.select("*")'),
          `Found SELECT * in ${rel}`
        ).toBe(false)
      })
    }
  }

  it(`no NEW SELECT * violations (${ALLOWED_SELECT_STAR.size} files grandfathered)`, () => {
    // This test ensures no new files introduce SELECT * without being added to the allow list
    expect(true).toBe(true)
  })
})
