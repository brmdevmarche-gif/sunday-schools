import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ count: 0 })
    }

    const { data, error } = await supabase.rpc('get_unviewed_announcements_count')
    if (error) {
      return NextResponse.json({ count: 0, error: error.message }, { status: 200 })
    }

    return NextResponse.json({ count: (data as number) || 0 })
  } catch (e: any) {
    return NextResponse.json({ count: 0, error: e?.message || 'Unknown error' }, { status: 200 })
  }
}


