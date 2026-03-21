'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { connectPermissionsStream } from '@/lib/sunday-school/permissions-sse.client'
import {
  getUserPermissionCodes,
  getCurrentUserPermissions,
} from '@/lib/sunday-school/roles.client'
import type { Permission } from '@/lib/types/modules/permissions'
import { clientLogger } from '@/lib/client-logger'

interface PermissionsContextValue {
  permissions: Permission[]
  permissionCodes: string[]
  hasPermission: (code: string) => boolean
  hasAnyPermission: (codes: string[]) => boolean
  hasAllPermissions: (codes: string[]) => boolean
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined)

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [permissionCodes, setPermissionCodes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadPermissions = useCallback(() => {
    // Skip permissions fetch on login page - avoids auth requests before session exists
    if (pathname?.startsWith('/login')) {
      setPermissionCodes([])
      setPermissions([])
      setIsLoading(false)
      return () => {}
    }

    setIsLoading(true)
    setError(null)

    const fallbackToDirectFetch = async () => {
      try {
        const [codes, perms] = await Promise.all([
          getUserPermissionCodes(),
          getCurrentUserPermissions(),
        ])
        setPermissionCodes(codes)
        setPermissions(perms)
      } catch (err) {
        const message =
          err instanceof Error && err.message.toLowerCase().includes('fetch')
            ? 'Unable to reach Supabase. Check your connection and ensure your project is not paused (Supabase Dashboard → Project Settings).'
            : err instanceof Error
              ? err.message
              : 'Failed to load permissions'
        setError(new Error(message))
      } finally {
        setIsLoading(false)
      }
    }

    const cleanup = connectPermissionsStream({
      onPermissions: ({ permissionCodes: codes, permissions: perms }) => {
        setPermissionCodes(codes)
        setPermissions(perms)
        if (codes.length === 0) {
          clientLogger.warn('No permissions found for current user')
        } else {
          clientLogger.info('Loaded permissions', { count: codes.length })
        }
        setIsLoading(false)
      },
      onError: () => {
        fallbackToDirectFetch()
      },
    })

    return cleanup
  }, [pathname])

  useEffect(() => {
    const cleanup = loadPermissions()
    return () => cleanup?.()
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
