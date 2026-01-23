-- =====================================================
-- QUICK SETUP: Create Full Admin Role and Assign to User
-- =====================================================
-- This is a simplified version that does everything in one go
-- =====================================================

-- Create role with all permissions and assign to admin@knasty.local
WITH 
  -- Step 1: Create or get the role
  role_created AS (
    INSERT INTO public.roles (title, description, is_system_role, is_active)
    VALUES ('Full Admin', 'Full system access with all permissions', false, true)
    ON CONFLICT (title) DO UPDATE 
    SET description = EXCLUDED.description,
        is_active = EXCLUDED.is_active
    RETURNING id
  ),
  -- Step 2: Assign all permissions to the role
  permissions_assigned AS (
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT 
      (SELECT id FROM role_created),
      p.id
    FROM public.permissions p
    WHERE p.is_active = true
    ON CONFLICT (role_id, permission_id) DO NOTHING
  )
-- Step 3: Assign role to user
INSERT INTO public.user_roles (user_id, role_id, assigned_at)
SELECT 
  u.id,
  (SELECT id FROM role_created),
  NOW()
FROM public.users u
WHERE u.email = 'admin@knasty.local'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Verification
SELECT 
  'Role created and assigned successfully!' as status,
  r.title as role_name,
  COUNT(DISTINCT rp.permission_id) as permissions_count,
  u.email as user_email,
  u.full_name as user_name
FROM public.roles r
JOIN public.role_permissions rp ON r.id = rp.role_id
JOIN public.user_roles ur ON r.id = ur.role_id
JOIN public.users u ON ur.user_id = u.id
WHERE r.title = 'Full Admin'
  AND u.email = 'admin@knasty.local'
GROUP BY r.title, u.email, u.full_name;
