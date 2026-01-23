-- =====================================================
-- MAP EXISTING USERS TO ROLES
-- Migration: 49_map_existing_users_to_roles.sql
-- =====================================================
-- Maps existing users with their role field to the new role system
-- This migration should be run after 47 and 48
-- =====================================================

-- =====================================================
-- 1. MAP USERS TO SYSTEM ROLES BASED ON THEIR ROLE FIELD
-- =====================================================

-- Map super_admin users
INSERT INTO public.user_roles (user_id, role_id, assigned_at)
SELECT 
  u.id,
  r.id,
  NOW()
FROM public.users u
JOIN public.roles r ON r.title = 'Super Admin'
WHERE u.role = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

-- Map diocese_admin users
INSERT INTO public.user_roles (user_id, role_id, assigned_at)
SELECT 
  u.id,
  r.id,
  NOW()
FROM public.users u
JOIN public.roles r ON r.title = 'Diocese Admin'
WHERE u.role = 'diocese_admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

-- Map church_admin users
INSERT INTO public.user_roles (user_id, role_id, assigned_at)
SELECT 
  u.id,
  r.id,
  NOW()
FROM public.users u
JOIN public.roles r ON r.title = 'Church Admin'
WHERE u.role = 'church_admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

-- Map teacher users
INSERT INTO public.user_roles (user_id, role_id, assigned_at)
SELECT 
  u.id,
  r.id,
  NOW()
FROM public.users u
JOIN public.roles r ON r.title = 'Teacher'
WHERE u.role = 'teacher'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

-- =====================================================
-- 2. CREATE HELPER FUNCTION TO GET USER PERMISSIONS (CLIENT-SAFE)
-- =====================================================

-- This function returns permission codes as a simple array
-- which is easier to work with client-side
CREATE OR REPLACE FUNCTION get_user_permission_codes(user_id_param UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT p.code
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_id_param
      AND p.is_active = true
  );
END;
$$;

COMMENT ON FUNCTION get_user_permission_codes IS 'Get all permission codes for a user as a text array (client-safe)';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
