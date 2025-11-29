-- Create Admin User via SQL
-- Run this in Supabase SQL Editor: https://wzfkvegqytcnjdkxowvx.supabase.co

-- Step 1: Check if user already exists in auth.users
DO $$
DECLARE
  user_exists BOOLEAN;
  user_id UUID;
BEGIN
  -- Check if user exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@knasty.local'
  ) INTO user_exists;

  IF user_exists THEN
    RAISE NOTICE 'User already exists in auth.users, getting user ID...';
    SELECT id INTO user_id FROM auth.users WHERE email = 'admin@knasty.local';
  ELSE
    RAISE NOTICE 'Creating new user in auth.users...';
    -- Create auth user
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
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@knasty.local',
      crypt('123456789', gen_salt('bf')), -- Password: 123456789
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"admin","full_name":"System Administrator"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO user_id;
  END IF;

  RAISE NOTICE 'User ID: %', user_id;

  -- Step 2: Create or update profile in public.users
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
    user_id,
    'admin@knasty.local',
    'admin',
    'System Administrator',
    'super_admin',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id)
  DO UPDATE SET
    role = 'super_admin',
    username = 'admin',
    full_name = 'System Administrator',
    is_active = true,
    updated_at = NOW();

  RAISE NOTICE 'Profile created/updated successfully!';
END $$;

-- Verify the user was created
SELECT
  u.id,
  u.email,
  u.username,
  u.full_name,
  u.role,
  u.is_active,
  u.created_at
FROM public.users u
WHERE u.email = 'admin@knasty.local';

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ ADMIN USER CREATED SUCCESSFULLY!';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'Email:    admin@knasty.local';
  RAISE NOTICE 'Password: 123456789';
  RAISE NOTICE 'Username: admin';
  RAISE NOTICE 'Role:     super_admin';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Login at: http://localhost:3000/login';
END $$;
