import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e/**/*.spec.ts', 'security/**/*.spec.ts', 'accessibility/**/*.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'reports/playwright' }],
    ['json', { outputFile: 'reports/bug-report.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'PLAYWRIGHT_TESTING=true npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'setup',
      testDir: './tests/fixtures',
      testMatch: 'auth.setup.ts',
    },
    {
      name: 'en-desktop',
      use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/admin.json' },
      dependencies: ['setup'],
    },
    {
      name: 'en-mobile',
      use: { ...devices['Pixel 5'], storageState: 'tests/.auth/admin.json' },
      dependencies: ['setup'],
    },
    {
      name: 'ar-desktop',
      use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/admin.json', locale: 'ar' },
      dependencies: ['setup'],
    },
    {
      name: 'ar-mobile',
      use: { ...devices['Pixel 5'], storageState: 'tests/.auth/admin.json', locale: 'ar' },
      dependencies: ['setup'],
    },
    {
      name: 'security',
      testDir: './tests/security',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'accessibility',
      testDir: './tests/accessibility',
      use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/admin.json' },
      dependencies: ['setup'],
    },
  ],
})
