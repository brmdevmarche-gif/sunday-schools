-- =====================================================
-- CREATE ADMIN USER (For Fresh Database)
-- =====================================================
-- Run this AFTER running 00_FRESH_DATABASE_SETUP.sql
-- This creates admin@knasty.local with password: 123456789
-- =====================================================

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Generate a UUID for the admin user
  admin_user_id := gen_random_uuid();

  -- Step 1: Create user in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    admin_user_id,
    'authenticated',
    'authenticated',
    'admin@knasty.local',
    crypt('123456789', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"username": "admin", "full_name": "System Administrator"}',
    false,
    '',
    '',
    '',
    ''
  );

  RAISE NOTICE 'Created auth user with ID: %', admin_user_id;

  -- Step 2: The trigger should auto-create the profile, but let's verify and update
  -- Wait a moment for trigger to fire
  PERFORM pg_sleep(0.5);

  -- Step 3: Update the profile to super_admin
  UPDATE public.users
  SET
    role = 'super_admin',
    username = 'admin',
    full_name = 'System Administrator',
    is_active = true
  WHERE id = admin_user_id;

  RAISE NOTICE 'Updated user profile to super_admin';

EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'User already exists! Updating role...';

    -- If user exists, just update the role
    UPDATE public.users
    SET
      role = 'super_admin',
      username = 'admin',
      full_name = 'System Administrator',
      is_active = true
    WHERE email = 'admin@knasty.local';

  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating admin user: %', SQLERRM;
END $$;

-- Verify the admin user was created
SELECT
  '✅ Admin User Created' as status,
  u.id,
  u.email,
  u.username,
  u.role,
  u.is_active,
  a.email_confirmed_at IS NOT NULL as email_confirmed
FROM public.users u
JOIN auth.users a ON a.id = u.id
WHERE u.email = 'admin@knasty.local';

-- Display credentials
SELECT
  '═══════════════════════════════════════' as " ",
  '✅ ADMIN USER READY!' as "STATUS",
  '═══════════════════════════════════════' as "  ";

SELECT
  'Email' as credential,
  'admin@knasty.local' as value
UNION ALL
SELECT
  'Password',
  '123456789'
UNION ALL
SELECT
  'Username',
  'admin'
UNION ALL
SELECT
  'Role',
  'super_admin'
UNION ALL
SELECT
  'Login URL',
  'http://localhost:3000/login';

SELECT '═══════════════════════════════════════' as " ";
