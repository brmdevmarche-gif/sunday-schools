import type { Page, BrowserContext } from '@playwright/test'

export async function setLocale(context: BrowserContext, locale: 'en' | 'ar') {
  await context.addCookies([{
    name: 'NEXT_LOCALE',
    value: locale,
    domain: 'localhost',
    path: '/',
  }])
}

export async function setDarkMode(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark')
    document.documentElement.classList.add('dark')
  })
}

export function uniqueId(prefix: string) {
  return `${prefix}-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
