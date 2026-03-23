import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Accessibility tests using axe-core.
 * Tests WCAG 2.2 AA compliance on key pages in both locales.
 */

const PAGES = [
  { path: '/login', name: 'Login', requiresAuth: false },
  { path: '/admin', name: 'Admin Dashboard', requiresAuth: true },
]

test.describe('Accessibility: English locale', () => {
  for (const page of PAGES) {
    test(`${page.name} (${page.path}) passes axe-core WCAG AA`, async ({ page: pwPage }) => {
      await pwPage.context().addCookies([{
        name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/',
      }])
      await pwPage.goto(page.path)
      await pwPage.waitForLoadState('domcontentloaded')

      const results = await new AxeBuilder({ page: pwPage })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze()

      const violations = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
      }))

      expect(
        results.violations,
        `Accessibility violations found:\n${JSON.stringify(violations, null, 2)}`
      ).toEqual([])
    })
  }
})

test.describe('Accessibility: Arabic locale', () => {
  for (const page of PAGES) {
    test(`${page.name} (${page.path}) [ar] passes axe-core WCAG AA`, async ({ page: pwPage }) => {
      await pwPage.context().addCookies([{
        name: 'NEXT_LOCALE', value: 'ar', domain: 'localhost', path: '/',
      }])
      await pwPage.goto(page.path)
      await pwPage.waitForLoadState('domcontentloaded')

      const results = await new AxeBuilder({ page: pwPage })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze()

      expect(results.violations).toEqual([])
    })
  }
})

test.describe('RTL verification', () => {
  test('Arabic locale sets dir="rtl" on html element', async ({ page }) => {
    await page.context().addCookies([{
      name: 'NEXT_LOCALE', value: 'ar', domain: 'localhost', path: '/',
    }])
    await page.goto('/login')
    const dir = await page.locator('html').getAttribute('dir')
    expect(dir).toBe('rtl')
  })

  test('English locale sets dir="ltr" on html element', async ({ page }) => {
    await page.context().addCookies([{
      name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/',
    }])
    await page.goto('/login')
    const dir = await page.locator('html').getAttribute('dir')
    expect(dir || 'ltr').toBe('ltr')
  })
})

test.describe('Heading hierarchy', () => {
  test('login page has exactly one h1', async ({ page }) => {
    await page.goto('/login')
    const h1Count = await page.getByRole('heading', { level: 1 }).count()
    expect(h1Count).toBe(1)
  })

  test('admin page has exactly one h1', async ({ page }) => {
    await page.goto('/admin')
    const h1Count = await page.getByRole('heading', { level: 1 }).count()
    expect(h1Count).toBe(1)
  })
})

test.describe('Skip link', () => {
  test('skip-to-main link exists and targets #main-content', async ({ page }) => {
    await page.goto('/login')
    const skipLink = page.locator('a[href="#main-content"]')
    await expect(skipLink).toBeAttached()
  })
})
