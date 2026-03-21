import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/lib/types/modules/base'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ADMIN_ROLES, STAFF_ROLES } from '@/lib/constants/roles'

type AuthSuccess = {
  success: true
  user: { id: string }
  profile: { id: string; role: UserRole }
  supabase: SupabaseClient
}

type AuthError = {
  success: false
  error: NextResponse
}

type AuthResult = AuthSuccess | AuthError

function isAuthError(result: AuthResult): result is AuthError {
  return !result.success
}

/**
 * Require authenticated user for API routes.
 * Returns the supabase client, user, and profile, or an error response.
 */
export async function requireApiAuth(): Promise<AuthResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return {
      success: false,
      error: NextResponse.json({ error: 'User profile not found' }, { status: 401 }),
    }
  }

  return {
    success: true,
    user,
    profile: { ...profile, role: profile.role as UserRole },
    supabase,
  }
}

/**
 * Require authenticated admin user for API routes.
 * Returns 401 if not authenticated, 403 if not admin.
 */
export async function requireAdminApiUser(): Promise<AuthResult> {
  const result = await requireApiAuth()
  if (isAuthError(result)) return result

  if (!ADMIN_ROLES.has(result.profile.role)) {
    return {
      success: false,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return result
}

/**
 * Require authenticated staff user (admin or teacher) for API routes.
 */
export async function requireStaffApiUser(): Promise<AuthResult> {
  const result = await requireApiAuth()
  if (isAuthError(result)) return result

  if (!STAFF_ROLES.has(result.profile.role)) {
    return {
      success: false,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return result
}

export { isAuthError }
