import { test as setup } from '@playwright/test'

/**
 * Fill in real test credentials before running E2E tests.
 * These accounts must exist in Supabase Auth with the correct roles.
 */
const TEST_ACCOUNTS: Record<string, { identifier: string; password: string }> = {
  admin: { identifier: process.env.TEST_ADMIN_EMAIL || 'admin@test.com', password: process.env.TEST_ADMIN_PASSWORD || 'testpass123' },
  teacher: { identifier: process.env.TEST_TEACHER_EMAIL || 'teacher@test.com', password: process.env.TEST_TEACHER_PASSWORD || 'testpass123' },
  parent: { identifier: process.env.TEST_PARENT_EMAIL || 'parent@test.com', password: process.env.TEST_PARENT_PASSWORD || 'testpass123' },
}

for (const [role, creds] of Object.entries(TEST_ACCOUNTS)) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email|identifier|user code/i).fill(creds.identifier)
    await page.getByLabel(/password/i).fill(creds.password)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15_000 })
    await page.context().storageState({ path: `tests/.auth/${role}.json` })
  })
}
