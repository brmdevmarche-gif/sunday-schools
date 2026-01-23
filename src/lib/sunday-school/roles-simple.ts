// Simplified version - just fetch roles without permissions to test
import { createClient as createServerClient } from '../supabase/server'
import type { RoleWithPermissions } from '../types/modules/permissions'

export async function getRolesSimple(filters?: {
  isActive?: boolean
}): Promise<RoleWithPermissions[]> {
  const supabase = await createServerClient()

  let query = supabase
    .from('roles')
    .select('*')
    .order('is_system_role', { ascending: false })
    .order('title', { ascending: true })

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }

  const { data: roles, error } = await query

  if (error) {
    // Avoid console.error in Server Components (Next dev overlay treats it as a runtime error).
    const msg = [
      'getRolesSimple failed',
      error.message,
      error.code ? `code=${error.code}` : null,
      error.details ? `details=${error.details}` : null,
      error.hint ? `hint=${error.hint}` : null,
    ]
      .filter(Boolean)
      .join(' | ')
    throw new Error(msg)
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
      const msg = [
        'getRolesSimple failed while fetching role_permissions',
        rpError.message,
        rpError.code ? `code=${rpError.code}` : null,
        rpError.details ? `details=${rpError.details}` : null,
        rpError.hint ? `hint=${rpError.hint}` : null,
      ]
        .filter(Boolean)
        .join(' | ')
      throw new Error(msg)
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
}
