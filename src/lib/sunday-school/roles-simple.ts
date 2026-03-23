// Simplified version - just fetch roles without permissions to test
import { createClient as createServerClient } from '../supabase/server'
import type { RoleWithPermissions } from '../types/modules/permissions'

export async function getRolesSimple(filters?: {
  isActive?: boolean
}): Promise<RoleWithPermissions[]> {
  try {
    const supabase = await createServerClient()

    let query = supabase
      .from('roles')
      .select('id, title, description, is_system_role, is_active, created_by, created_at, updated_at')
      .order('is_system_role', { ascending: false })
      .order('title', { ascending: true })

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    const { data: roles, error } = await query

    if (error) {
      // Return empty array instead of throwing to prevent server render errors
      return []
    }

    if (!roles || roles.length === 0) return []

    // Compute permission counts per role (cheap; avoids fetching full permissions)
    const roleIds = roles
      .map((r: any) => r?.id)
      .filter((id: any) => id !== null && id !== undefined)
      .map((id: any) => String(id))

    const countsByRoleId = new Map<string, number>()
    if (roleIds.length > 0) {
      const { data: rolePermissions, error: rpError } = await supabase
        .from('role_permissions')
        .select('role_id')
        .in('role_id', roleIds)

      if (rpError) {
        // Return roles without permission counts if permission fetch fails
        return roles.map((role: any) => ({
          id: String(role.id),
          title: String(role.title),
          description: role.description ? String(role.description) : null,
          is_system_role: Boolean(role.is_system_role),
          is_active: Boolean(role.is_active),
          created_by: role.created_by ? String(role.created_by) : null,
          created_at: String(role.created_at),
          updated_at: String(role.updated_at),
          permissions: [],
          permission_count: 0,
        })) as RoleWithPermissions[]
      }

      for (const rp of rolePermissions || []) {
        const rid = rp?.role_id ? String(rp.role_id) : null
        if (!rid) continue
        countsByRoleId.set(rid, (countsByRoleId.get(rid) ?? 0) + 1)
      }
    }

    // Return roles + permission_count (permissions list omitted for performance)
    return roles.map((role: any) => ({
      id: String(role.id),
      title: String(role.title),
      description: role.description ? String(role.description) : null,
      is_system_role: Boolean(role.is_system_role),
      is_active: Boolean(role.is_active),
      created_by: role.created_by ? String(role.created_by) : null,
      created_at: String(role.created_at),
      updated_at: String(role.updated_at),
      permissions: [],
      permission_count: countsByRoleId.get(String(role.id)) ?? 0,
    })) as RoleWithPermissions[]
  } catch {
    // Return empty array on any error to prevent server render failures
    return []
  }
}

