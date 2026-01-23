-- =====================================================
-- PERMISSIONS & ROLES SYSTEM
-- Migration: 47_create_permissions_system.sql
-- =====================================================
-- Creates the foundation for dynamic permissions and roles management
-- This replaces hardcoded role checks with a flexible database-driven system
-- =====================================================

-- =====================================================
-- 1. PERMISSIONS TABLE
-- =====================================================
-- Stores all available permissions in the system
-- Permissions are auto-generated from the permission registry

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- e.g., "dioceses.view"
  name TEXT NOT NULL, -- e.g., "View Dioceses"
  description TEXT,
  module TEXT NOT NULL, -- e.g., "dioceses"
  resource TEXT NOT NULL, -- e.g., "dioceses"
  action TEXT NOT NULL, -- e.g., "view", "create", "update", "delete"
  category TEXT, -- e.g., "navigation", "action", "view"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for permissions
CREATE INDEX IF NOT EXISTS idx_permissions_module ON public.permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON public.permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON public.permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON public.permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_is_active ON public.permissions(is_active);

-- =====================================================
-- 2. ROLES TABLE
-- =====================================================
-- Stores custom and system roles
-- System roles (super_admin, etc.) are marked with is_system_role = true

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false, -- For built-in roles like super_admin
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for roles
CREATE INDEX IF NOT EXISTS idx_roles_title ON public.roles(title);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON public.roles(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_is_system_role ON public.roles(is_system_role);
CREATE INDEX IF NOT EXISTS idx_roles_created_by ON public.roles(created_by);

-- =====================================================
-- 3. ROLE_PERMISSIONS TABLE (Junction)
-- =====================================================
-- Links roles to their permissions (many-to-many)

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Indexes for role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission_id);

-- =====================================================
-- 4. USER_ROLES TABLE (Junction)
-- =====================================================
-- Links users to their roles (many-to-many)
-- Note: Users can have multiple roles

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Indexes for user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON public.user_roles(assigned_by);

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. RLS POLICIES - PERMISSIONS
-- =====================================================
-- All authenticated users can view active permissions

CREATE POLICY "Users can view active permissions"
  ON public.permissions
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only super admins can manage permissions
CREATE POLICY "Super admins can manage permissions"
  ON public.permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- =====================================================
-- 7. RLS POLICIES - ROLES
-- =====================================================
-- All authenticated users can view active roles

CREATE POLICY "Users can view active roles"
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only super admins can create roles
CREATE POLICY "Super admins can create roles"
  ON public.roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Only super admins can update roles (except system roles)
CREATE POLICY "Super admins can update non-system roles"
  ON public.roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
    AND is_system_role = false
  );

-- Only super admins can delete non-system roles
CREATE POLICY "Super admins can delete non-system roles"
  ON public.roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
    AND is_system_role = false
  );

-- =====================================================
-- 8. RLS POLICIES - ROLE_PERMISSIONS
-- =====================================================
-- Users can view role permissions for active roles

CREATE POLICY "Users can view role permissions"
  ON public.role_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roles
      WHERE id = role_permissions.role_id
      AND is_active = true
    )
  );

-- Only super admins can manage role permissions
CREATE POLICY "Super admins can manage role permissions"
  ON public.role_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- =====================================================
-- 9. RLS POLICIES - USER_ROLES
-- =====================================================
-- Users can view their own roles
-- Admins can view roles of users in their scope

CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view roles of users in their scope
CREATE POLICY "Admins can view user roles in scope"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'super_admin'
        OR (u.role = 'diocese_admin' AND EXISTS (
          SELECT 1 FROM public.users ur
          WHERE ur.id = user_roles.user_id
          AND ur.diocese_id = u.diocese_id
        ))
        OR (u.role = 'church_admin' AND EXISTS (
          SELECT 1 FROM public.users ur
          WHERE ur.id = user_roles.user_id
          AND ur.church_id = u.church_id
        ))
      )
    )
  );

-- Only super admins can assign roles
CREATE POLICY "Super admins can manage user roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- =====================================================
-- 10. HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
  user_id_param UUID,
  permission_code_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_id_param
      AND p.code = permission_code_param
      AND p.is_active = true
  );
END;
$$;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(user_id_param UUID)
RETURNS TABLE (
  permission_code TEXT,
  permission_name TEXT,
  module TEXT,
  resource TEXT,
  action TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.code,
    p.name,
    p.module,
    p.resource,
    p.action
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON ur.role_id = rp.role_id
  JOIN public.permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = user_id_param
    AND p.is_active = true
  ORDER BY p.module, p.resource, p.action;
END;
$$;

-- Function to get all roles for a user
CREATE OR REPLACE FUNCTION get_user_roles(user_id_param UUID)
RETURNS TABLE (
  role_id UUID,
  role_title TEXT,
  role_description TEXT,
  is_system_role BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.description,
    r.is_system_role
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = user_id_param
    AND r.is_active = true
  ORDER BY r.is_system_role DESC, r.title;
END;
$$;

-- =====================================================
-- 11. COMMENTS
-- =====================================================

COMMENT ON TABLE public.permissions IS 'Stores all available permissions in the system';
COMMENT ON TABLE public.roles IS 'Stores custom and system roles';
COMMENT ON TABLE public.role_permissions IS 'Junction table linking roles to permissions';
COMMENT ON TABLE public.user_roles IS 'Junction table linking users to roles';

COMMENT ON FUNCTION user_has_permission IS 'Check if a user has a specific permission';
COMMENT ON FUNCTION get_user_permissions IS 'Get all permissions for a user';
COMMENT ON FUNCTION get_user_roles IS 'Get all roles for a user';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
