'use client'

import { useEffect, useState, useContext } from 'react'
import {
  getUserPermissionCodes,
  currentUserHasPermission,
  getCurrentUserPermissions,
} from '@/lib/sunday-school/roles.client'
import { PermissionsContext } from '@/contexts/PermissionsContext'
import type { Permission } from '@/lib/types/modules/permissions'

interface UsePermissionsResult {
  permissions: Permission[]
  permissionCodes: string[]
  hasPermission: (code: string) => boolean
  hasAnyPermission: (codes: string[]) => boolean
  hasAllPermissions: (codes: string[]) => boolean
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * React hook for checking user permissions in client components
 * Uses the shared PermissionsContext if available, otherwise falls back to local state
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { hasPermission, isLoading } = usePermissions()
 *   
 *   if (isLoading) return <div>Loading...</div>
 *   
 *   if (!hasPermission('dioceses.view')) {
 *     return <div>No access</div>
 *   }
 *   
 *   return <div>Content</div>
 * }
 * ```
 */
export function usePermissions(): UsePermissionsResult {
  // Try to use context first (if PermissionsProvider is available)
  const context = useContext(PermissionsContext)
  if (context) {
    return context
  }

  const [permissions, setPermissions] = useState<Permission[]>([])
  const [permissionCodes, setPermissionCodes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadPermissions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [codes, perms] = await Promise.all([
        getUserPermissionCodes(),
        getCurrentUserPermissions(),
      ])

      setPermissionCodes(codes)
      setPermissions(perms)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load permissions')
      setError(error)
      console.error('Error loading permissions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPermissions()
  }, [])

  const hasPermission = (code: string): boolean => {
    return permissionCodes.includes(code)
  }

  const hasAnyPermission = (codes: string[]): boolean => {
    return codes.some((code) => permissionCodes.includes(code))
  }

  const hasAllPermissions = (codes: string[]): boolean => {
    return codes.every((code) => permissionCodes.includes(code))
  }

  return {
    permissions,
    permissionCodes,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading,
    error,
    refetch: loadPermissions,
  }
}

/**
 * Hook to check a single permission
 * Returns true during loading to prevent buttons from disappearing during initial load
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const canView = useHasPermission('dioceses.view')
 *   
 *   if (!canView) return null
 *   return <div>Content</div>
 * }
 * ```
 */
export function useHasPermission(permissionCode: string): boolean {
  const { hasPermission, isLoading } = usePermissions()
  
  // During loading, return true optimistically to prevent buttons from disappearing
  // This prevents the "all buttons hidden" issue during initial load
  if (isLoading) return true
  
  return hasPermission(permissionCode)
}
