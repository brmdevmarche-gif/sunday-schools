'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  getUserPermissionCodes,
  getCurrentUserPermissions,
} from '@/lib/sunday-school/roles.client'
import type { Permission } from '@/lib/types/modules/permissions'

interface PermissionsContextValue {
  permissions: Permission[]
  permissionCodes: string[]
  hasPermission: (code: string) => boolean
  hasAnyPermission: (codes: string[]) => boolean
  hasAllPermissions: (codes: string[]) => boolean
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined)

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [permissionCodes, setPermissionCodes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadPermissions = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [codes, perms] = await Promise.all([
        getUserPermissionCodes(),
        getCurrentUserPermissions(),
      ])

      setPermissionCodes(codes)
      setPermissions(perms)
      
      // Log for debugging
      if (codes.length === 0) {
        console.warn('No permissions found for current user')
      } else {
        console.log('Loaded permissions:', codes.length, 'permissions')
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load permissions')
      setError(error)
      console.error('Error loading permissions:', error)
      // Don't clear permissions on error - keep last known state
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  const hasPermission = useCallback((code: string): boolean => {
    return permissionCodes.includes(code)
  }, [permissionCodes])

  const hasAnyPermission = useCallback((codes: string[]): boolean => {
    return codes.some((code) => permissionCodes.includes(code))
  }, [permissionCodes])

  const hasAllPermissions = useCallback((codes: string[]): boolean => {
    return codes.every((code) => permissionCodes.includes(code))
  }, [permissionCodes])

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        permissionCodes,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isLoading,
        error,
        refetch: loadPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissionsContext() {
  const context = useContext(PermissionsContext)
  if (context === undefined) {
    throw new Error('usePermissionsContext must be used within a PermissionsProvider')
  }
  return context
}
