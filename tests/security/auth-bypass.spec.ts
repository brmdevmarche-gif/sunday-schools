import { test, expect } from '@playwright/test'

/**
 * OWASP WSTG-AUTHZ-02: Testing for Bypassing Authorization Schema
 *
 * Verifies that protected routes redirect unauthenticated users to /login
 * and that role-based access control is enforced.
 */

const ADMIN_ROUTES = [
  '/admin',
  '/admin/users',
  '/admin/classes',
  '/admin/settings',
  '/admin/announcements',
]

const TEACHER_ROUTES = ['/dashboard/teacher']
const PARENT_ROUTES = ['/dashboard/parents']

test.describe('Unauthenticated access (forced browsing)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  for (const route of ADMIN_ROUTES) {
    test(`unauthenticated user is redirected from ${route}`, async ({ page }) => {
      await page.goto(route)
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
    })
  }

  for (const route of TEACHER_ROUTES) {
    test(`unauthenticated user is redirected from ${route}`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
    })
  }

  for (const route of PARENT_ROUTES) {
    test(`unauthenticated user is redirected from ${route}`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
    })
  }
})

test.describe('Vertical privilege escalation: teacher accessing admin', () => {
  test.use({ storageState: 'tests/.auth/teacher.json' })

  for (const route of ADMIN_ROUTES) {
    test(`teacher cannot access ${route}`, async ({ page }) => {
      await page.goto(route)
      // Should redirect away from admin or show unauthorized
      const url = page.url()
      const isBlocked =
        !url.includes('/admin') ||
        url.includes('/unauthorized') ||
        url.includes('/login')
      expect(isBlocked, `Teacher should not access ${route}, got ${url}`).toBe(true)
    })
  }
})

test.describe('Vertical privilege escalation: parent accessing admin', () => {
  test.use({ storageState: 'tests/.auth/parent.json' })

  for (const route of ADMIN_ROUTES) {
    test(`parent cannot access ${route}`, async ({ page }) => {
      await page.goto(route)
      const url = page.url()
      const isBlocked =
        !url.includes('/admin') ||
        url.includes('/unauthorized') ||
        url.includes('/login')
      expect(isBlocked, `Parent should not access ${route}, got ${url}`).toBe(true)
    })
  }

  for (const route of TEACHER_ROUTES) {
    test(`parent cannot access ${route}`, async ({ page }) => {
      await page.goto(route)
      const url = page.url()
      const isBlocked =
        !url.includes('/dashboard/teacher') ||
        url.includes('/unauthorized') ||
        url.includes('/login')
      expect(isBlocked, `Parent should not access ${route}, got ${url}`).toBe(true)
    })
  }
})
