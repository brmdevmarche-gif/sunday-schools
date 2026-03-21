import 'server-only'

import { createClient } from './supabase/server'
import { logger } from './logger'

export interface UserAccessSummary {
  userId: string
  email: string
  fullName: string | null
  role: string
  isActive: boolean
  roles: { roleId: string; roleTitle: string; assignedAt: string; assignedBy: string | null }[]
  permissionCount: number
  lastLogin: string | null
  loginCount30d: number
}

/**
 * Get a comprehensive access review report for all users or a specific scope.
 * Used for periodic SOC 2 access reviews.
 * Only accessible by super_admin (caller must verify).
 */
export async function getAccessReviewReport(options?: {
  dioceseId?: string
  churchId?: string
  includeInactive?: boolean
  limit?: number
  offset?: number
}): Promise<{ data: UserAccessSummary[]; count: number | null }> {
  const supabase = await createClient()

  // Get users with their role assignments
  let usersQuery = supabase
    .from('users')
    .select('id, email, full_name, role, is_active', { count: 'exact' })
    .order('full_name', { ascending: true })

  if (!options?.includeInactive) {
    usersQuery = usersQuery.eq('is_active', true)
  }
  if (options?.dioceseId) {
    usersQuery = usersQuery.eq('diocese_id', options.dioceseId)
  }
  if (options?.churchId) {
    usersQuery = usersQuery.eq('church_id', options.churchId)
  }

  usersQuery = usersQuery.range(
    options?.offset ?? 0,
    (options?.offset ?? 0) + (options?.limit ?? 100) - 1
  )

  const { data: users, error: usersError, count } = await usersQuery

  if (usersError || !users) {
    logger.error('Error fetching users for access review', usersError)
    return { data: [], count: 0 }
  }

  // For each user, get role assignments, permission count, and login stats
  const summaries: UserAccessSummary[] = await Promise.all(
    users.map(async (user) => {
      // Get role assignments
      const { data: roleAssignments } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          assigned_at,
          assigned_by,
          roles (title)
        `)
        .eq('user_id', user.id)

      // Get permission count
      const { data: permCodes } = await supabase.rpc('get_user_permission_codes', {
        user_id_param: user.id,
      })

      // Get last login and 30-day login count
      const { data: lastLoginData } = await supabase
        .from('login_history')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('success', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { count: loginCount } = await supabase
        .from('login_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('success', true)
        .gte('created_at', thirtyDaysAgo.toISOString())

      return {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active ?? false,
        roles: (roleAssignments || []).map((ra) => ({
          roleId: ra.role_id,
          roleTitle: (ra.roles as unknown as { title: string })?.title || 'Unknown',
          assignedAt: ra.assigned_at,
          assignedBy: ra.assigned_by,
        })),
        permissionCount: (permCodes as string[] | null)?.length ?? 0,
        lastLogin: lastLoginData?.created_at ?? null,
        loginCount30d: loginCount ?? 0,
      }
    })
  )

  return { data: summaries, count }
}

/**
 * Get users who have not logged in within a given number of days.
 * Useful for identifying stale accounts that should be deactivated.
 */
export async function getStaleAccounts(
  inactiveDays: number = 90
): Promise<{ userId: string; email: string; fullName: string | null; role: string; lastLogin: string | null }[]> {
  const supabase = await createClient()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - inactiveDays)

  // Get active users
  const { data: activeUsers } = await supabase
    .from('users')
    .select('id, email, full_name, role')
    .eq('is_active', true)

  if (!activeUsers) return []

  const staleUsers: { userId: string; email: string; fullName: string | null; role: string; lastLogin: string | null }[] = []

  for (const user of activeUsers) {
    const { data: lastLogin } = await supabase
      .from('login_history')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('success', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!lastLogin || new Date(lastLogin.created_at) < cutoff) {
      staleUsers.push({
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        lastLogin: lastLogin?.created_at ?? null,
      })
    }
  }

  return staleUsers
}
