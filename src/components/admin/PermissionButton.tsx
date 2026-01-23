'use client'

import type { ComponentProps, ReactNode } from 'react'
import { useHasPermission } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type PermissionButtonProps = ComponentProps<typeof Button> & {
  permission: string
  tooltip?: string
  children: ReactNode
}

/**
 * Button that only renders if user has the required permission
 * 
 * @example
 * ```tsx
 * <PermissionButton 
 *   permission="dioceses.create"
 *   onClick={handleCreate}
 *   tooltip="You need permission to create dioceses"
 * >
 *   Create Diocese
 * </PermissionButton>
 * ```
 */
export function PermissionButton({
  permission,
  tooltip = 'You do not have permission for this action',
  children,
  ...props
}: PermissionButtonProps) {
  const hasPermission = useHasPermission(permission)

  if (!hasPermission) {
    if (tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button {...props} disabled>
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      )
    }
    return null
  }

  return <Button {...props}>{children}</Button>
}
