import { createClient } from '../supabase/client'
import type { Permission } from '../types/modules/permissions'

/**
 * Get all permission codes for the current user (client-side)
 * This is a simplified version that returns just the codes
 */
export async function getUserPermissionCodes(): Promise<string[]> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase.rpc('get_user_permission_codes', {
    user_id_param: user.id,
  })

  if (error) {
    console.error('Error fetching user permissions:', error)
    return []
  }

  return (data || []) as string[]
}

/**
 * Check if current user has a specific permission (client-side)
 */
export async function currentUserHasPermission(
  permissionCode: string
): Promise<boolean> {
  const permissions = await getUserPermissionCodes()
  return permissions.includes(permissionCode)
}

/**
 * Get all permissions for the current user (client-side)
 * Returns full permission objects
 */
export async function getCurrentUserPermissions(): Promise<Permission[]> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  // Get permission codes first
  const permissionCodes = await getUserPermissionCodes()
  if (permissionCodes.length === 0) return []

  // Fetch full permission details
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .in('code', permissionCodes)
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching permission details:', error)
    return []
  }

  return (data || []) as Permission[]
}
