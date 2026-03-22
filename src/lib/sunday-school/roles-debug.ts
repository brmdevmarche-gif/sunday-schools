// Debug version - simplified query to isolate the issue
import { createClient as createServerClient } from '../supabase/server'
import type { RoleWithPermissions } from '../types/modules/permissions'
import { logger } from '@/lib/logger'

export async function getRolesWithPermissionsDebug(filters?: {
  isActive?: boolean
}): Promise<RoleWithPermissions[]> {
  try {
    const supabase = await createServerClient()

    // Step 1: Just fetch roles - no joins
    logger.debug('Step 1: Fetching roles...')
    let rolesQuery = supabase
      .from('roles')
      .select('*')
      .order('is_system_role', { ascending: false })
      .order('title', { ascending: true })

    if (filters?.isActive !== undefined) {
      rolesQuery = rolesQuery.eq('is_active', filters.isActive)
    }

    const { data: roles, error: rolesError } = await rolesQuery

    if (rolesError) {
      logger.error('Error fetching roles:', rolesError)
      throw rolesError
    }

    logger.debug('Roles fetched:', roles?.length || 0)

    if (!roles || roles.length === 0) {
      return []
    }

    // Step 2: Fetch role_permissions
    logger.debug('Step 2: Fetching role_permissions...')
    const roleIds = roles.map((r: any) => r.id)
    logger.debug('Role IDs:', roleIds)

    const { data: rolePermissions, error: rpError } = await supabase
      .from('role_permissions')
      .select('role_id, permission_id')
      .in('role_id', roleIds)

    if (rpError) {
      logger.error('Error fetching role_permissions:', rpError)
      throw rpError
    }

    logger.debug('Role permissions fetched:', rolePermissions?.length || 0)

    // Step 3: Get permission IDs
    const permissionIds = [
      ...new Set(
        (rolePermissions || [])
          .map((rp: any) => rp.permission_id)
          .filter((id: any) => id !== null && id !== undefined)
      ),
    ]

    logger.debug('Permission IDs:', permissionIds.length)

    // Step 4: Fetch permissions
    let permissions: any[] = []
    if (permissionIds.length > 0) {
      logger.debug('Step 3: Fetching permissions...')
      const { data: permsData, error: permsError } = await supabase
        .from('permissions')
        .select('*')
        .in('id', permissionIds)

      if (permsError) {
        logger.error('Error fetching permissions:', permsError)
        throw permsError
      }

      permissions = permsData || []
      logger.debug('Permissions fetched:', permissions.length)
    }

    // Step 5: Map together
    const permissionsMap = new Map<string, any>()
    permissions.forEach((p) => {
      permissionsMap.set(p.id, p)
    })

    const permissionsByRole = new Map<string, any[]>()
    if (rolePermissions) {
      for (const rp of rolePermissions) {
        if (rp.permission_id && rp.role_id) {
          const roleId = rp.role_id as string
          const permissionId = rp.permission_id as string
          const permission = permissionsMap.get(permissionId)

          if (permission) {
            if (!permissionsByRole.has(roleId)) {
              permissionsByRole.set(roleId, [])
            }
            permissionsByRole.get(roleId)!.push(permission)
          }
        }
      }
    }

    // Step 6: Combine
    const result = roles.map((role: any) => ({
      ...role,
      permissions: permissionsByRole.get(role.id) || [],
      permission_count: permissionsByRole.get(role.id)?.length || 0,
    }))

    logger.debug(`Final result: ${result.length} roles`)
    return result as RoleWithPermissions[]
  } catch (error: any) {
    logger.error('Fatal error in getRolesWithPermissionsDebug:', error)
    logger.error('Error code:', error?.code)
    logger.error('Error message:', error?.message)
    logger.error('Error details:', error?.details)
    logger.error('Error hint:', error?.hint)
    throw error
  }
}
