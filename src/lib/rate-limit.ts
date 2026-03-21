import 'server-only'

import { createAdminClient } from './supabase/admin'
import { headers } from 'next/headers'

interface RateLimitResult {
  success: boolean
  remaining: number
  retryAfter?: number
}

/**
 * Supabase-backed rate limiter using a simple table.
 * Counts requests per key within a sliding window.
 *
 * Requires the `rate_limit_entries` table (created via migration).
 * Falls back to allowing the request if the table doesn't exist yet.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const supabase = createAdminClient()
    const windowStart = new Date(Date.now() - windowMs).toISOString()

    // Clean old entries and count recent ones in one pass
    await supabase
      .from('rate_limit_entries')
      .delete()
      .lt('created_at', windowStart)

    const { count } = await supabase
      .from('rate_limit_entries')
      .select('*', { count: 'exact', head: true })
      .eq('key', key)
      .gte('created_at', windowStart)

    const currentCount = count ?? 0

    if (currentCount >= limit) {
      return {
        success: false,
        remaining: 0,
        retryAfter: Math.ceil(windowMs / 1000),
      }
    }

    // Record this request
    await supabase.from('rate_limit_entries').insert({
      key,
      created_at: new Date().toISOString(),
    })

    return {
      success: true,
      remaining: limit - currentCount - 1,
    }
  } catch {
    // If rate limit table doesn't exist or errors, allow the request
    // to avoid blocking legitimate users due to infra issues
    return { success: true, remaining: limit }
  }
}

/**
 * Get a rate limit key based on the client IP + an action identifier.
 */
export async function getRateLimitKey(action: string): Promise<string> {
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'
  return `${action}:${ip}`
}
