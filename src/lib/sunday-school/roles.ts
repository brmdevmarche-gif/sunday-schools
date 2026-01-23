import { createClient } from '../supabase/client'
import { createClient as createServerClient } from '../supabase/server'
import type {
  Role,
  RoleWithPermissions,
  Permission,
  CreateRoleInput,
  UpdateRoleInput,
} from '../types/modules/permissions'

/**
 * Get all roles
 */
export async function getRoles(filters?: {
  isActive?: boolean
  isSystemRole?: boolean
}): Promise<Role[]> {
  const supabase = createClient()

  let query = supabase
    .from('roles')
    .select('*')
    .order('is_system_role', { ascending: false })
    .order('title', { ascending: true })

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }
  if (filters?.isSystemRole !== undefined) {
    query = query.eq('is_system_role', filters.isSystemRole)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Role[]
}

/**
 * Get all roles with their permissions
 * Uses server client for server components
 */
export async function getRolesWithPermissions(filters?: {
  isActive?: boolean
}): Promise<RoleWithPermissions[]> {
  try {
    // Use server client for proper authentication context
    const supabase = await createServerClient()

    // First, fetch roles
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
      console.error('Error fetching roles:', rolesError)
      console.error('Error details:', JSON.stringify(rolesError, null, 2))
      throw rolesError
    }

    if (!roles || roles.length === 0) {
      return []
    }

  // Fetch all role_permissions for these roles
  const roleIds = roles
    .map((r: any) => {
      const id = r?.id
      return id ? String(id).trim() : null
    })
    .filter((id: string | null): id is string => id !== null && id.length === 36) // UUIDs are 36 chars
  
  if (roleIds.length === 0) {
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

  // Fetch role_permissions in batches if needed (Supabase has limits)
  let rolePermissions: any[] = []
  const batchSize = 100
  for (let i = 0; i < roleIds.length; i += batchSize) {
    const batch = roleIds.slice(i, i + batchSize)
    const { data: batchData, error } = await supabase
      .from('role_permissions')
      .select('role_id, permission_id')
      .in('role_id', batch)
    
    if (error) {
      console.error('Error fetching role permissions batch:', error)
      console.error('Batch:', batch)
      throw error
    }
    
    if (batchData) {
      rolePermissions = rolePermissions.concat(batchData)
    }
  }

  // Get unique permission IDs and ensure they're valid UUIDs
  const permissionIds = [
    ...new Set(
      (rolePermissions || [])
        .map((rp: any) => {
          const id = rp?.permission_id
          return id ? String(id).trim() : null
        })
        .filter((id: string | null): id is string => id !== null && id.length === 36)
    ),
  ]

  // Fetch all permissions in batches
  let permissions: Permission[] = []
  if (permissionIds.length > 0) {
    const batchSize = 100
    for (let i = 0; i < permissionIds.length; i += batchSize) {
      const batch = permissionIds.slice(i, i + batchSize)
      const { data: permsData, error } = await supabase
        .from('permissions')
        .select('*')
        .in('id', batch)
      
      if (error) {
        console.error('Error fetching permissions batch:', error)
        console.error('Batch:', batch)
        throw error
      }
      
      if (permsData) {
        permissions = permissions.concat(permsData as Permission[])
      }
    }
  }

  // Create a map for quick lookup
  const permissionsMap = new Map<string, Permission>()
  permissions.forEach((p: any) => {
    if (p && p.id) {
      permissionsMap.set(String(p.id), p)
    }
  })

  // Group permissions by role_id
  const permissionsByRole = new Map<string, Permission[]>()
  if (rolePermissions) {
    for (const rp of rolePermissions) {
      if (rp.permission_id && rp.role_id) {
        const roleId = String(rp.role_id)
        const permissionId = String(rp.permission_id)
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

    // Combine roles with their permissions
    // Ensure all data is properly serializable
    return roles.map((role: any) => {
      const roleId = String(role.id)
      const rolePerms = permissionsByRole.get(roleId) || []
      return {
        id: String(role.id),
        title: String(role.title),
        description: role.description ? String(role.description) : null,
        is_system_role: Boolean(role.is_system_role),
        is_active: Boolean(role.is_active),
        created_by: role.created_by ? String(role.created_by) : null,
        created_at: String(role.created_at),
        updated_at: String(role.updated_at),
        permissions: rolePerms.map((p: any) => ({
          id: String(p.id),
          code: String(p.code),
          name: String(p.name),
          description: p.description ? String(p.description) : null,
          module: String(p.module),
          resource: String(p.resource),
          action: String(p.action),
          category: p.category ? String(p.category) : null,
          is_active: Boolean(p.is_active),
          created_at: String(p.created_at),
          updated_at: String(p.updated_at),
        })),
        permission_count: rolePerms.length,
      }
    }) as RoleWithPermissions[]
  } catch (error: any) {
    console.error('Error in getRolesWithPermissions:', error)
    console.error('Error code:', error?.code)
    console.error('Error message:', error?.message)
    console.error('Error details:', error?.details)
    console.error('Error hint:', error?.hint)
    throw error
  }
}

/**
 * Get a single role by ID
 */
export async function getRoleById(id: string): Promise<RoleWithPermissions | null> {
  const supabase = await createServerClient()

  // Fetch the role
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id, title, description, is_system_role, is_active, created_by, created_at, updated_at')
    .eq('id', id)
    .single()

  if (roleError) {
    if (roleError.code === 'PGRST116') return null
    throw roleError
  }

  // Fetch permission IDs for this role
  const { data: rolePermissions, error: rpError } = await supabase
    .from('role_permissions')
    .select('permission_id')
    .eq('role_id', id)

  if (rpError) {
    console.error('Error fetching role permissions:', rpError)
    throw rpError
  }

  // Get permission IDs
  const permissionIds = (rolePermissions || [])
    .map((rp: any) => rp.permission_id)
    .filter((id: any) => id !== null && id !== undefined)

  // Fetch permissions
  let permissions: Permission[] = []
  if (permissionIds.length > 0) {
    const { data: permsData, error: permsError } = await supabase
      .from('permissions')
      .select('id, code, name, description, module, resource, action, category, is_active, created_at, updated_at')
      .in('id', permissionIds)

    if (permsError) {
      console.error('Error fetching permissions:', permsError)
      console.error('Error details:', JSON.stringify(permsError, null, 2))
      throw permsError
    }

    permissions = (permsData || []) as Permission[]
  }

  return {
    ...role,
    permissions,
    permission_count: permissions.length,
  } as RoleWithPermissions
}

/**
 * Create a new role
 */
export async function createRole(input: CreateRoleInput): Promise<RoleWithPermissions> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Start a transaction-like operation
  // First, create the role
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .insert({
      title: input.title,
      description: input.description || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (roleError) throw roleError

  // Then, assign permissions
  if (input.permission_ids.length > 0) {
    const rolePermissions = input.permission_ids.map((permission_id) => ({
      role_id: role.id,
      permission_id,
    }))

    const { error: permissionsError } = await supabase
      .from('role_permissions')
      .insert(rolePermissions)

    if (permissionsError) {
      // Rollback: delete the role if permissions insertion fails
      await supabase.from('roles').delete().eq('id', role.id)
      throw permissionsError
    }
  }

  // Fetch the complete role with permissions
  return getRoleById(role.id) as Promise<RoleWithPermissions>
}

/**
 * Update a role
 */
export async function updateRole(
  id: string,
  input: UpdateRoleInput
): Promise<RoleWithPermissions> {
  const supabase = await createServerClient()

  // Update role fields
  const updates: any = {}
  if (input.title !== undefined) updates.title = input.title
  if (input.description !== undefined) updates.description = input.description
  if (input.is_active !== undefined) updates.is_active = input.is_active

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from('roles')
      .update(updates)
      .eq('id', id)

    if (updateError) throw updateError
  }

  // Update permissions if provided
  if (input.permission_ids !== undefined) {
    // Delete existing permissions
    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', id)

    if (deleteError) throw deleteError

    // Insert new permissions
    if (input.permission_ids.length > 0) {
      const rolePermissions = input.permission_ids.map((permission_id) => ({
        role_id: id,
        permission_id,
      }))

      const { error: insertError } = await supabase
        .from('role_permissions')
        .insert(rolePermissions)

      if (insertError) throw insertError
    }
  }

  // Fetch the updated role with permissions
  return getRoleById(id) as Promise<RoleWithPermissions>
}

/**
 * Delete a role (only if not a system role)
 */
export async function deleteRole(id: string): Promise<void> {
  const supabase = await createServerClient()

  // Check if it's a system role
  const role = await getRoleById(id)
  if (!role) throw new Error('Role not found')
  if (role.is_system_role) {
    throw new Error('Cannot delete system role')
  }

  const { error } = await supabase.from('roles').delete().eq('id', id)

  if (error) throw error
}

/**
 * Get all permissions
 */
export async function getPermissions(filters?: {
  module?: string
  isActive?: boolean
}): Promise<Permission[]> {
  const supabase = await createServerClient()

  let query = supabase
    .from('permissions')
    .select('*')
    .order('module', { ascending: true })
    .order('resource', { ascending: true })
    .order('action', { ascending: true })

  if (filters?.module) {
    query = query.eq('module', filters.module)
  }
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Permission[]
}

/**
 * Get permissions grouped by module
 */
export async function getPermissionsByModule(): Promise<
  Record<string, Permission[]>
> {
  const permissions = await getPermissions({ isActive: true })
  const grouped: Record<string, Permission[]> = {}

  for (const permission of permissions) {
    if (!grouped[permission.module]) {
      grouped[permission.module] = []
    }
    grouped[permission.module].push(permission)
  }

  return grouped
}

/**
 * Check if user has a specific permission
 */
export async function userHasPermission(
  userId: string,
  permissionCode: string
): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('user_has_permission', {
    user_id_param: userId,
    permission_code_param: permissionCode,
  })

  if (error) throw error
  return data as boolean
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('get_user_permissions', {
    user_id_param: userId,
  })

  if (error) throw error
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
