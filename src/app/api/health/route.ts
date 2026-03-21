import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {}

  try {
    // Use admin client to bypass RLS — avoids false negatives
    // when the health check runs without an authenticated session
    const supabase = createAdminClient()
    const { error } = await supabase.from('users').select('id').limit(1)
    checks.database = error ? 'error' : 'ok'
  } catch {
    checks.database = 'error'
  }

  const allOk = Object.values(checks).every((v) => v === 'ok')

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  )
}
