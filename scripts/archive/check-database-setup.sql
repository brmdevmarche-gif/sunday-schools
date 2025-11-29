-- Check Database Setup Status
-- Run this in Supabase SQL Editor to verify migrations

-- Check 1: Does public.users table exist and have the right columns?
SELECT
  'public.users columns' as check_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Check 2: Does the trigger exist?
SELECT
  'Triggers' as check_name,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  OR event_object_schema = 'auth';

-- Check 3: Can we query public.users?
SELECT 'User count' as check_name, COUNT(*) as count
FROM public.users;

-- Check 4: Do auth.users exist?
SELECT 'Auth users count' as check_name, COUNT(*) as count
FROM auth.users;

-- Check 5: Any users with admin email?
SELECT 'Admin user search' as check_name, email, id
FROM auth.users
WHERE email LIKE '%admin%';
