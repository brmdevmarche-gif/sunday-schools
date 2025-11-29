-- Fix Trigger Issue and Create Admin User
-- Run this ENTIRE script in Supabase SQL Editor

-- Step 1: Disable the problematic trigger temporarily
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Step 2: Delete any existing admin user (cleanup)
DELETE FROM public.users WHERE email = 'admin@knasty.local';
DELETE FROM auth.users WHERE email = 'admin@knasty.local';

-- Step 3: Create auth user directly
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Generate UUID
  new_user_id := gen_random_uuid();

  -- Insert into auth.users
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
    new_user_id,
    'authenticated',
    'authenticated',
    'admin@knasty.local',
    crypt('123456789', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    '',
    '',
    '',
    ''
  );

  -- Insert into public.users manually
  INSERT INTO public.users (
    id,
    email,
    username,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'admin@knasty.local',
    'admin',
    'System Administrator',
    'super_admin',
    true,
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Admin user created with ID: %', new_user_id;
END $$;

-- Step 4: Re-enable the trigger for future users
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- Step 5: Verify the user was created
SELECT
  '✅ auth.users' as table_name,
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users
WHERE email = 'admin@knasty.local';

SELECT
  '✅ public.users' as table_name,
  id,
  email,
  username,
  role,
  is_active
FROM public.users
WHERE email = 'admin@knasty.local';

-- Success message
SELECT
  '✅✅✅ ADMIN USER CREATED SUCCESSFULLY! ✅✅✅' as "STATUS",
  'admin@knasty.local' as "EMAIL",
  '123456789' as "PASSWORD",
  'admin' as "USERNAME",
  'super_admin' as "ROLE",
  'http://localhost:3000/login' as "LOGIN_URL";
