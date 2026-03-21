import 'server-only'

import { NextRequest, NextResponse } from 'next/server'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Validate that mutating requests originate from the same host.
 * Returns an error response if the Origin doesn't match, or null if OK.
 *
 * Safe methods (GET, HEAD, OPTIONS) are always allowed.
 * Non-browser requests (no Origin header) are allowed — they can't carry cookies.
 */
export function validateCsrf(request: NextRequest): NextResponse | null {
  if (SAFE_METHODS.has(request.method)) return null

  const origin = request.headers.get('origin')

  // No Origin header means non-browser request (curl, Postman, etc.)
  // These can't carry cookies automatically, so CSRF isn't a concern
  if (!origin) return null

  const host = request.headers.get('host')
  if (!host) return null

  try {
    const originHost = new URL(origin).host
    if (originHost !== host) {
      return NextResponse.json(
        { error: 'Forbidden: cross-origin request' },
        { status: 403 }
      )
    }
  } catch {
    return NextResponse.json(
      { error: 'Forbidden: invalid origin' },
      { status: 403 }
    )
  }

  return null
}

/**
 * Wraps a route handler with CSRF validation.
 * Usage: export const POST = withCsrf(async (request) => { ... })
 */
export function withCsrf<T extends NextRequest>(
  handler: (request: T, ...args: unknown[]) => Promise<NextResponse>
) {
  return async (request: T, ...args: unknown[]) => {
    const csrfError = validateCsrf(request)
    if (csrfError) return csrfError
    return handler(request, ...args)
  }
}
