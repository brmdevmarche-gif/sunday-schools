import { describe, it, expect } from 'vitest'
import { validateCsrf } from '@/lib/api/csrf'
import { NextRequest } from 'next/server'

/**
 * validateCsrf imports 'server-only' which throws at import time in test env.
 * We mock the module to prevent that.
 */

// Mock 'server-only' to be a no-op
import { vi } from 'vitest'
vi.mock('server-only', () => ({}))

function makeRequest(
  method: string,
  options?: { origin?: string; host?: string }
): NextRequest {
  const headers = new Headers()
  if (options?.origin) headers.set('origin', options.origin)
  if (options?.host) headers.set('host', options.host)

  return new NextRequest('http://localhost:3000/api/test', {
    method,
    headers,
  })
}

describe('validateCsrf', () => {
  it('allows GET requests', () => {
    const req = makeRequest('GET', { origin: 'https://evil.com', host: 'localhost:3000' })
    expect(validateCsrf(req)).toBeNull()
  })

  it('allows HEAD requests', () => {
    const req = makeRequest('HEAD', { origin: 'https://evil.com', host: 'localhost:3000' })
    expect(validateCsrf(req)).toBeNull()
  })

  it('allows OPTIONS requests', () => {
    const req = makeRequest('OPTIONS')
    expect(validateCsrf(req)).toBeNull()
  })

  it('allows POST with matching origin and host', () => {
    const req = makeRequest('POST', {
      origin: 'http://localhost:3000',
      host: 'localhost:3000',
    })
    expect(validateCsrf(req)).toBeNull()
  })

  it('rejects POST with mismatched origin', async () => {
    const req = makeRequest('POST', {
      origin: 'https://evil.example.com',
      host: 'localhost:3000',
    })
    const result = validateCsrf(req)
    expect(result).not.toBeNull()
    const body = await result!.json()
    expect(result!.status).toBe(403)
    expect(body.error).toContain('cross-origin')
  })

  it('allows POST without origin header (non-browser request)', () => {
    const req = makeRequest('POST', { host: 'localhost:3000' })
    expect(validateCsrf(req)).toBeNull()
  })

  it('allows POST without host header', () => {
    const req = makeRequest('POST', { origin: 'http://localhost:3000' })
    expect(validateCsrf(req)).toBeNull()
  })

  it('rejects POST with invalid origin URL', async () => {
    const req = makeRequest('POST', {
      origin: 'not-a-valid-url',
      host: 'localhost:3000',
    })
    const result = validateCsrf(req)
    expect(result).not.toBeNull()
    const body = await result!.json()
    expect(result!.status).toBe(403)
    expect(body.error).toContain('invalid origin')
  })

  it('rejects PUT with mismatched origin', async () => {
    const req = makeRequest('PUT', {
      origin: 'https://evil.example.com',
      host: 'localhost:3000',
    })
    const result = validateCsrf(req)
    expect(result).not.toBeNull()
    expect(result!.status).toBe(403)
  })

  it('rejects DELETE with mismatched origin', async () => {
    const req = makeRequest('DELETE', {
      origin: 'https://evil.example.com',
      host: 'localhost:3000',
    })
    const result = validateCsrf(req)
    expect(result).not.toBeNull()
    expect(result!.status).toBe(403)
  })
})
