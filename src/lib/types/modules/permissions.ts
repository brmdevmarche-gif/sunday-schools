// =====================================================
// PERMISSIONS & ROLES TYPES
// =====================================================

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string;
  resource: string;
  action: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  title: string;
  description: string | null;
  is_system_role: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

// Mapping row from `user_roles` (assigning a Role to a user).
// Named to avoid clashing with the base `UserRole` union type (e.g. "teacher", "parent", ...).
export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
  permission_count: number;
}

export interface PermissionGroup {
  module: string;
  permissions: Array<{
    code: string;
    action: string;
    definition: {
      name: string;
      description: string;
      category: 'navigation' | 'action' | 'view';
    };
  }>;
}

export interface CreateRoleInput {
  title: string;
  description?: string;
  permission_ids: string[];
}

export interface UpdateRoleInput {
  title?: string;
  description?: string;
  permission_ids?: string[];
  is_active?: boolean;
}
