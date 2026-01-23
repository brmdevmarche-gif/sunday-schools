'use client'

import { usePermissions } from '@/hooks/usePermissions'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldX, ArrowLeft } from 'lucide-react'

interface PermissionGuardProps {
  permission: string | string[]
  requireAll?: boolean // If true, requires ALL permissions; if false, requires ANY
  redirectTo?: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Component that guards content based on permissions
 * 
 * @example
 * ```tsx
 * <PermissionGuard permission="dioceses.view">
 *   <DiocesesList />
 * </PermissionGuard>
 * ```
 * 
 * @example
 * ```tsx
 * <PermissionGuard 
 *   permission={['dioceses.view', 'dioceses.create']}
 *   requireAll={false}
 * >
 *   <DiocesesList />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  permission,
  requireAll = false,
  redirectTo,
  fallback,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions()
  const router = useRouter()

  const permissions = Array.isArray(permission) ? permission : [permission]
  const hasAccess = requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions)

  useEffect(() => {
    if (!isLoading && !hasAccess && redirectTo) {
      router.push(redirectTo)
    }
  }, [isLoading, hasAccess, redirectTo, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    if (redirectTo) {
      return null // Will redirect via useEffect
    }

    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldX className="h-5 w-5 text-destructive" />
            <CardTitle>Access Denied</CardTitle>
          </div>
          <CardDescription>
            You do not have permission to view this content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Required permission{permissions.length > 1 ? 's' : ''}:{' '}
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {permissions.join(', ')}
            </code>
          </p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}

/**
 * Simple wrapper for checking a single permission
 */
export function RequirePermission({
  permission,
  children,
  ...props
}: Omit<PermissionGuardProps, 'permission'> & { permission: string }) {
  return (
    <PermissionGuard permission={permission} {...props}>
      {children}
    </PermissionGuard>
  )
}
