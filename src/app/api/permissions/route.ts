import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type { Permission } from '@/lib/types/modules/permissions'

/**
 * Single API endpoint for roles and permissions.
 * Reduces multiple client requests to one server round-trip.
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: codes, error: codesError } = await supabase.rpc(
      'get_user_permission_codes',
      { user_id_param: user.id }
    )

    if (codesError) {
      logger.error('Error fetching permissions:', codesError)
      return NextResponse.json(
        { error: 'Failed to fetch permissions' },
        { status: 500 }
      )
    }

    const permissionCodes = (codes || []) as string[]

    if (permissionCodes.length === 0) {
      return NextResponse.json({
        permissionCodes: [],
        permissions: [],
      })
    }

    const { data: perms, error: permsError } = await supabase
      .from('permissions')
      .select('id, code, name, description, module, resource, action, category, is_active, created_at, updated_at')
      .in('code', permissionCodes)
      .eq('is_active', true)

    if (permsError) {
      logger.error('Error fetching permission details:', permsError)
      return NextResponse.json({
        permissionCodes,
        permissions: [] as Permission[],
      })
    }

    return NextResponse.json({
      permissionCodes,
      permissions: (perms || []) as Permission[],
    })
  } catch (err) {
    logger.error('Permissions API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
