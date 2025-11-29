-- Fix Church Creation RLS Policies
-- Run this in Supabase SQL Editor if you get 400 errors when creating churches

-- Step 1: Check current user's role
SELECT id, email, role, is_active FROM public.users WHERE email = 'admin@knasty.local';

-- Step 2: Drop existing restrictive policies on churches
DROP POLICY IF EXISTS "Super admins can manage all churches" ON public.churches;
DROP POLICY IF EXISTS "Diocese admins can manage churches in their diocese" ON public.churches;
DROP POLICY IF EXISTS "Church admins can view and update their church" ON public.churches;

-- Step 3: Create comprehensive policies for churches

-- Super admins can do everything
CREATE POLICY "Super admins full access to churches"
  ON public.churches
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- Diocese admins can manage churches in their diocese
CREATE POLICY "Diocese admins can manage their diocese churches"
  ON public.churches
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role = 'diocese_admin'
        AND diocese_id = churches.diocese_id
        AND is_active = true
    )
  );

-- Church admins can view and update their own church
CREATE POLICY "Church admins can view their church"
  ON public.churches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role = 'church_admin'
        AND church_id = churches.id
        AND is_active = true
    )
  );

CREATE POLICY "Church admins can update their church"
  ON public.churches
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role = 'church_admin'
        AND church_id = churches.id
        AND is_active = true
    )
  );

-- All authenticated users can view churches (for dropdowns, etc.)
CREATE POLICY "Authenticated users can view all churches"
  ON public.churches
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Step 4: Verify policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'churches'
ORDER BY policyname;

-- Step 5: Test - Try to insert a test church (delete after)
-- This should work if you're super_admin
SELECT 'Testing church creation permissions...' as status;
