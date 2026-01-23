-- =====================================================
-- CREATE ADMIN ROLE WITH ALL PERMISSIONS
-- AND ASSIGN TO USER: admin@knasty.local
-- =====================================================

-- Step 1: Create the new role
INSERT INTO public.roles (title, description, is_system_role, is_active)
VALUES (
  'Full Admin',
  'Full system access with all permissions',
  false,
  true
)
ON CONFLICT (title) DO UPDATE 
SET description = EXCLUDED.description,
    is_active = EXCLUDED.is_active
RETURNING id;

-- Step 2: Get the role ID (we'll use a variable approach)
DO $$
DECLARE
  v_role_id UUID;
  v_user_id UUID;
BEGIN
  -- Get or create the role
  SELECT id INTO v_role_id
  FROM public.roles
  WHERE title = 'Full Admin';
  
  IF v_role_id IS NULL THEN
    INSERT INTO public.roles (title, description, is_system_role, is_active)
    VALUES ('Full Admin', 'Full system access with all permissions', false, true)
    RETURNING id INTO v_role_id;
  END IF;

  -- Step 3: Assign ALL permissions to this role
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT 
    v_role_id,
    p.id
  FROM public.permissions p
  WHERE p.is_active = true
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Step 4: Find the user by email
  SELECT id INTO v_user_id
  FROM public.users
  WHERE email = 'admin@knasty.local';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email admin@knasty.local not found';
  END IF;

  -- Step 5: Assign the role to the user
  INSERT INTO public.user_roles (user_id, role_id, assigned_at)
  VALUES (v_user_id, v_role_id, NOW())
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RAISE NOTICE 'Role "Full Admin" created and assigned to admin@knasty.local';
  RAISE NOTICE 'Role ID: %', v_role_id;
  RAISE NOTICE 'User ID: %', v_user_id;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify the role was created
SELECT 
  id,
  title,
  description,
  is_system_role,
  is_active,
  (SELECT COUNT(*) FROM public.role_permissions WHERE role_id = roles.id) as permission_count
FROM public.roles
WHERE title = 'Full Admin';

-- Verify the user has the role
SELECT 
  u.email,
  u.full_name,
  r.title as role_title,
  r.description as role_description,
  ur.assigned_at
FROM public.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE u.email = 'admin@knasty.local'
  AND r.title = 'Full Admin';

-- Verify permissions count
SELECT 
  COUNT(*) as total_permissions,
  COUNT(DISTINCT rp.permission_id) as assigned_permissions
FROM public.roles r
JOIN public.role_permissions rp ON r.id = rp.role_id
WHERE r.title = 'Full Admin';
