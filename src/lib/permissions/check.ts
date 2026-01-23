// =====================================================
// PERMISSION CHECKING UTILITIES
// =====================================================
// Utilities for checking permissions in page components
// =====================================================

import { createClient } from '../supabase/client'
import type { Permission } from '../types/modules/permissions'

/**
 * Check if current user has a specific permission (server-side)
 */
export async function hasPermission(
  permissionCode: string,
  userId?: string
): Promise<boolean> {
  const supabase = createClient()

  let targetUserId = userId
  if (!targetUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false
    targetUserId = user.id
  }

  const { data, error } = await supabase.rpc('user_has_permission', {
    user_id_param: targetUserId,
    permission_code_param: permissionCode,
  })

  if (error) {
    console.error('Error checking permission:', error)
    return false
  }

  return data as boolean
}

/**
 * Check if current user has any of the specified permissions (server-side)
 */
export async function hasAnyPermission(
  permissionCodes: string[],
  userId?: string
): Promise<boolean> {
  if (permissionCodes.length === 0) return false

  for (const code of permissionCodes) {
    if (await hasPermission(code, userId)) {
      return true
    }
  }

  return false
}

/**
 * Check if current user has all of the specified permissions (server-side)
 */
export async function hasAllPermissions(
  permissionCodes: string[],
  userId?: string
): Promise<boolean> {
  if (permissionCodes.length === 0) return true

  for (const code of permissionCodes) {
    if (!(await hasPermission(code, userId))) {
      return false
    }
  }

  return true
}

/**
 * Get all permissions for a user (server-side)
 */
export async function getUserPermissions(
  userId?: string
): Promise<Permission[]> {
  const supabase = createClient()

  let targetUserId = userId
  if (!targetUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []
    targetUserId = user.id
  }

  const { data, error } = await supabase.rpc('get_user_permissions', {
    user_id_param: targetUserId,
  })

  if (error) {
    console.error('Error fetching user permissions:', error)
    return []
  }

  // Transform the RPC result to Permission objects
  return (data || []).map((p: any) => ({
    id: '', // RPC doesn't return id
    code: p.permission_code,
    name: p.permission_name,
    description: null,
    module: p.module,
    resource: p.resource,
    action: p.action,
    category: null,
    is_active: true,
    created_at: '',
    updated_at: '',
  })) as Permission[]
}

/**
 * Permission check result with redirect option
 */
export interface PermissionCheckResult {
  hasPermission: boolean
  redirectTo?: string
  message?: string
}

/**
 * Check permission and return result with redirect info
 * Useful for page components that need to redirect unauthorized users
 */
export async function checkPermissionWithRedirect(
  permissionCode: string,
  redirectTo: string = '/admin',
  userId?: string
): Promise<PermissionCheckResult> {
  const hasAccess = await hasPermission(permissionCode, userId)

  if (!hasAccess) {
    return {
      hasPermission: false,
      redirectTo,
      message: 'You do not have permission to access this page',
    }
  }

  return {
    hasPermission: true,
  }
}
