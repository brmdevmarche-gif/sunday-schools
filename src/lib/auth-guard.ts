import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'
import type { UserRole } from './types/modules/base'
import { ADMIN_ROLES, STAFF_ROLES } from './constants/roles'

export interface AuthUser {
  userId: string
  role: UserRole
}

/**
 * Get the current authenticated user and their role (cached per request).
 * Returns null if not authenticated.
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  // Inactive users are treated as unauthenticated
  if (!profile.is_active) return null

  return { userId: profile.id, role: profile.role as UserRole }
})

/**
 * Require an authenticated user. Redirects to login if not authenticated.
 * Use in server actions and server components.
 */
export async function requireAuth(): Promise<AuthUser> {
  const authUser = await getAuthUser()
  if (!authUser) {
    redirect('/login')
  }
  return authUser
}

/**
 * Require an authenticated user with an admin role.
 * Throws if not authenticated or not an admin.
 */
export async function requireAdmin(): Promise<AuthUser> {
  const authUser = await requireAuth()
  if (!ADMIN_ROLES.has(authUser.role)) {
    throw new Error('Unauthorized: admin role required')
  }
  return authUser
}

/**
 * Require an authenticated user with a staff role (admin or teacher).
 * Throws if not authenticated or not staff.
 */
export async function requireStaff(): Promise<AuthUser> {
  const authUser = await requireAuth()
  if (!STAFF_ROLES.has(authUser.role)) {
    throw new Error('Unauthorized: staff role required')
  }
  return authUser
}

/**
 * Require an authenticated user with a parent role.
 * Throws if not authenticated or not a parent.
 */
export async function requireParent(): Promise<AuthUser> {
  const authUser = await requireAuth()
  if (authUser.role !== 'parent') {
    throw new Error('Unauthorized: parent role required')
  }
  return authUser
}

/**
 * Require auth and redirect to login if not authenticated.
 * Use in page server components.
 */
export async function requireAuthOrRedirect(
  redirectTo: string = '/login'
): Promise<AuthUser> {
  const authUser = await getAuthUser()
  if (!authUser) {
    redirect(redirectTo)
  }
  return authUser
}

/**
 * Require admin role and redirect if unauthorized.
 * Use in admin page server components.
 */
export async function requireAdminOrRedirect(
  redirectTo: string = '/login'
): Promise<AuthUser> {
  const authUser = await getAuthUser()
  if (!authUser) {
    redirect(redirectTo)
  }
  if (!ADMIN_ROLES.has(authUser.role)) {
    redirect('/unauthorized')
  }
  return authUser
}
