-- =====================================================
-- ASSIGN EXISTING ROLE TO USER
-- =====================================================
-- Use this if you want to assign an existing role (like "Super Admin")
-- to the user instead of creating a new one
-- =====================================================

DO $$
DECLARE
  v_role_id UUID;
  v_user_id UUID;
  v_role_title TEXT := 'Super Admin'; -- Change this to the role you want
BEGIN
  -- Find the role
  SELECT id INTO v_role_id
  FROM public.roles
  WHERE title = v_role_title;

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Role "%" not found', v_role_title;
  END IF;

  -- Find the user
  SELECT id INTO v_user_id
  FROM public.users
  WHERE email = 'admin@knasty.local';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email admin@knasty.local not found';
  END IF;

  -- Assign the role
  INSERT INTO public.user_roles (user_id, role_id, assigned_at)
  VALUES (v_user_id, v_role_id, NOW())
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RAISE NOTICE 'Role "%" assigned to admin@knasty.local', v_role_title;
  RAISE NOTICE 'Role ID: %', v_role_id;
  RAISE NOTICE 'User ID: %', v_user_id;
END $$;

-- Verify
SELECT 
  u.email,
  r.title as role_title,
  ur.assigned_at
FROM public.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE u.email = 'admin@knasty.local';
