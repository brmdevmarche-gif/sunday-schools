import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Debug endpoint to check users in database
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const churchId = searchParams.get('churchId')
    const role = searchParams.get('role')

    let query = supabase
      .from('users')
      .select('id, email, full_name, role, church_id, is_active')
      .order('full_name', { ascending: true })

    if (churchId) {
      query = query.eq('church_id', churchId)
    }
    if (role) {
      query = query.eq('role', role)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      count: data?.length || 0,
      users: data || [],
      filters: { churchId, role },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

