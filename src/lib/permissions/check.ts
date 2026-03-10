// =====================================================
// PERMISSION CHECKING UTILITIES
// =====================================================
// Utilities for checking permissions in page components
// =====================================================

import { createClient } from '../supabase/server'
import { cache } from 'react'
import type { Permission } from '../types/modules/permissions'
import { hasForbiddenPermission } from '@/lib/permissions/forbidden'

// Cache user permissions per request to avoid multiple database calls
const getCachedUserPermissions = cache(async (userId: string): Promise<string[]> => {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('get_user_permissions', {
    user_id_param: userId,
  })

  if (error) {
    console.error('Error fetching user permissions:', error)
    return []
  }

  // Return just the permission codes for fast lookup
  const codes = (data || []).map((p: any) => p.permission_code) as string[]

  // If user has the forbidden permission, treat as "no permissions" server-side.
  // This prevents admin pages/actions from rendering before client-side hydration.
  if (hasForbiddenPermission(codes)) return []

  return codes
})

/**
 * Get current user ID (cached per request)
 */
const getCurrentUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id || null
})

/**
 * Check if current user has a specific permission (server-side)
 * Optimized to fetch all permissions once and cache them per request
 */
export async function hasPermission(
  permissionCode: string,
  userId?: string
): Promise<boolean> {
  let targetUserId: string | null | undefined = userId
  if (!targetUserId) {
    targetUserId = await getCurrentUserId()
    if (!targetUserId) return false
  }

  // Get cached permissions for this user (only fetched once per request)
  const permissions = await getCachedUserPermissions(targetUserId)
  return permissions.includes(permissionCode)
}

/**
 * Check if current user has any of the specified permissions (server-side)
 * Optimized to check against cached permissions
 */
export async function hasAnyPermission(
  permissionCodes: string[],
  userId?: string
): Promise<boolean> {
  if (permissionCodes.length === 0) return false

  let targetUserId: string | null | undefined = userId
  if (!targetUserId) {
    targetUserId = await getCurrentUserId()
    if (!targetUserId) return false
  }

  // Get cached permissions once
  const permissions = await getCachedUserPermissions(targetUserId)
  
  // Check if any permission code is in the cached list
  return permissionCodes.some(code => permissions.includes(code))
}

/**
 * Check if current user has all of the specified permissions (server-side)
 * Optimized to check against cached permissions
 */
export async function hasAllPermissions(
  permissionCodes: string[],
  userId?: string
): Promise<boolean> {
  if (permissionCodes.length === 0) return true

  let targetUserId: string | null | undefined = userId
  if (!targetUserId) {
    targetUserId = await getCurrentUserId()
    if (!targetUserId) return false
  }

  // Get cached permissions once
  const permissions = await getCachedUserPermissions(targetUserId)
  
  // Check if all permission codes are in the cached list
  return permissionCodes.every(code => permissions.includes(code))
}

/**
 * Get all permissions for a user (server-side)
 * Uses cached permissions to avoid duplicate database calls
 */
export async function getUserPermissions(
  userId?: string
): Promise<Permission[]> {
  let targetUserId: string | null | undefined = userId
  if (!targetUserId) {
    targetUserId = await getCurrentUserId()
    if (!targetUserId) return []
  }

  const supabase = await createClient()
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
