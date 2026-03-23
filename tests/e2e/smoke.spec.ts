import { test, expect } from '@playwright/test'

/**
 * Smoke tests: verify all major routes load without errors.
 * These run with admin auth by default (storageState from config).
 */

const PUBLIC_ROUTES = ['/login']

const PROTECTED_ROUTES = [
  '/admin',
  '/dashboard/teacher',
  '/dashboard/parents',
  '/store',
  '/activities',
  '/trips',
  '/gamification',
]

test.describe('Public routes load', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} returns 200`, async ({ page }) => {
      const response = await page.goto(route)
      expect(response?.status()).toBeLessThan(400)
    })

    test(`${route} has an h1`, async ({ page }) => {
      await page.goto(route)
      const h1 = page.getByRole('heading', { level: 1 })
      await expect(h1).toBeVisible()
    })

    test(`${route} has a title`, async ({ page }) => {
      await page.goto(route)
      const title = await page.title()
      expect(title.length).toBeGreaterThan(0)
    })
  }
})

test.describe('Protected routes load for authenticated admin', () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route} loads without error`, async ({ page }) => {
      const response = await page.goto(route)
      // Should load (200) or redirect within the app (not to login if authenticated)
      expect(response?.status()).toBeLessThan(500)
    })
  }
})

test.describe('Error handling', () => {
  test('non-existent route shows 404 page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345')
    expect(response?.status()).toBe(404)
  })
})

test.describe('No console errors on page load', () => {
  for (const route of ['/login', '/admin']) {
    test(`${route} has no console errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      await page.goto(route)
      await page.waitForLoadState('networkidle')

      // Filter out known benign errors (e.g., favicon, third-party)
      const realErrors = errors.filter(
        (e) => !e.includes('favicon') && !e.includes('404')
      )
      expect(realErrors).toEqual([])
    })
  }
})
