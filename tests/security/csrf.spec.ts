import { test, expect } from '@playwright/test'

/**
 * CSRF validation tests for mutating API endpoints.
 * Verifies that cross-origin POST/PUT/DELETE requests are rejected.
 */

const MUTATION_ENDPOINTS = [
  '/api/admin/create-user',
]

test.describe('CSRF protection on mutation endpoints', () => {
  for (const endpoint of MUTATION_ENDPOINTS) {
    test(`cross-origin POST to ${endpoint} returns 403`, async ({ request }) => {
      const response = await request.post(endpoint, {
        headers: {
          'Origin': 'https://evil.example.com',
          'Host': 'localhost:3000',
          'Content-Type': 'application/json',
        },
        data: { email: 'test@test.com', password: 'password123', role: 'student' },
      })
      expect(response.status()).toBe(403)
      const body = await response.json()
      expect(body.error).toContain('cross-origin')
    })
  }
})

test.describe('Same-origin requests are allowed (when authenticated)', () => {
  test.use({ storageState: 'tests/.auth/admin.json' })

  test('same-origin POST to create-user does not return 403', async ({ request }) => {
    const response = await request.post('/api/admin/create-user', {
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      data: { email: 'csrf-test-will-fail-validation@test.com' },
    })
    // Should get 400 (validation error) not 403 (CSRF)
    expect(response.status()).not.toBe(403)
  })
})
