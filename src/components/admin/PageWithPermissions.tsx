import { hasPermission, checkPermissionWithRedirect } from '@/lib/permissions/check'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

interface PageWithPermissionsProps {
  permission: string | string[]
  requireAll?: boolean
  redirectTo?: string
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Server component wrapper that checks permissions before rendering
 * 
 * @example
 * ```tsx
 * export default async function DiocesesPage() {
 *   return (
 *     <PageWithPermissions permission="dioceses.view">
 *       <DiocesesClient />
 *     </PageWithPermissions>
 *   )
 * }
 * ```
 */
export async function PageWithPermissions({
  permission,
  requireAll = false,
  redirectTo = '/admin',
  children,
  fallback,
}: PageWithPermissionsProps) {
  const permissions = Array.isArray(permission) ? permission : [permission]

  let hasAccess = false
  if (requireAll) {
    // Check all permissions
    const checks = await Promise.all(
      permissions.map((p) => hasPermission(p))
    )
    hasAccess = checks.every((check) => check === true)
  } else {
    // Check any permission
    const checks = await Promise.all(
      permissions.map((p) => hasPermission(p))
    )
    hasAccess = checks.some((check) => check === true)
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    // Use the first permission for the redirect check
    const check = await checkPermissionWithRedirect(
      permissions[0],
      redirectTo
    )

    if (check.redirectTo) {
      redirect(check.redirectTo)
    }

    return null
  }

  return <>{children}</>
}
