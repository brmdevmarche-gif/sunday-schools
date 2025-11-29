-- Simple Admin User Creation Script
-- Run this DIRECTLY in Supabase SQL Editor
-- URL: https://wzfkvegqytcnjdkxowvx.supabase.co

-- This script will:
-- 1. Delete any existing admin@knasty.local user (if exists)
-- 2. Create a fresh admin user
-- 3. Set password to 123456789

-- Step 1: Clean up any existing users (optional, comment out if you don't want this)
DELETE FROM auth.users WHERE email = 'admin@knasty.local';
DELETE FROM public.users WHERE email = 'admin@knasty.local';

-- Step 2: Create the admin user
-- Note: Replace 'YOUR_UUID_HERE' with a UUID or let Supabase generate one
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Generate a new UUID
  new_user_id := gen_random_uuid();

  -- Insert into auth.users (the authentication table)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
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
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- Insert into public.users (the profile table)
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

  RAISE NOTICE 'User created with ID: %', new_user_id;
END $$;

-- Step 3: Verify the user was created
SELECT
  'auth.users' as table_name,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'admin@knasty.local'

UNION ALL

SELECT
  'public.users' as table_name,
  id,
  email || ' (' || COALESCE(role, 'no role') || ')' as email,
  created_at,
  updated_at
FROM public.users
WHERE email = 'admin@knasty.local';

-- Success message
SELECT
  '✅ ADMIN USER CREATED!' as status,
  'admin@knasty.local' as email,
  '123456789' as password,
  'admin' as username,
  'super_admin' as role,
  'http://localhost:3000/login' as login_url;
