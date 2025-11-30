-- =====================================================
-- ADD ADMIN POLICIES FOR USERS TABLE
-- =====================================================
-- This migration adds RLS policies to allow admins
-- to view and manage users in their scope
-- Uses existing helper functions to avoid recursion
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Diocese admins can view users in their diocese" ON public.users;
DROP POLICY IF EXISTS "Diocese admins can update users in their diocese" ON public.users;
DROP POLICY IF EXISTS "Church admins can view users in their church" ON public.users;
DROP POLICY IF EXISTS "Church admins can update users in their church" ON public.users;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.users;
DROP POLICY IF EXISTS "Parents can view their children" ON public.users;

-- Helper function to get current user's role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.users WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's diocese_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_diocese_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT diocese_id FROM public.users WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's church_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_church_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT church_id FROM public.users WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Super admins can view all users
CREATE POLICY "Super admins can view all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (get_user_role() = 'super_admin');

-- Super admins can update all users
CREATE POLICY "Super admins can update all users"
  ON public.users FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'super_admin');

-- Super admins can delete users
CREATE POLICY "Super admins can delete users"
  ON public.users FOR DELETE
  TO authenticated
  USING (get_user_role() = 'super_admin');

-- Diocese admins can view users in their diocese
CREATE POLICY "Diocese admins can view users in their diocese"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'diocese_admin'
    AND diocese_id = get_user_diocese_id()
  );

-- Diocese admins can update users in their diocese
CREATE POLICY "Diocese admins can update users in their diocese"
  ON public.users FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'diocese_admin'
    AND diocese_id = get_user_diocese_id()
  );

-- Church admins can view users in their church
CREATE POLICY "Church admins can view users in their church"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'church_admin'
    AND church_id = get_user_church_id()
  );

-- Church admins can update users in their church
CREATE POLICY "Church admins can update users in their church"
  ON public.users FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'church_admin'
    AND church_id = get_user_church_id()
  );

-- Teachers can view students in their classes
CREATE POLICY "Teachers can view students in their classes"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    role = 'student'
    AND EXISTS (
      SELECT 1 FROM public.class_assignments AS teacher_assignment
      JOIN public.class_assignments AS student_assignment
        ON teacher_assignment.class_id = student_assignment.class_id
      WHERE teacher_assignment.user_id = auth.uid()
        AND teacher_assignment.assignment_type = 'teacher'
        AND student_assignment.user_id = users.id
        AND student_assignment.assignment_type = 'student'
    )
  );

-- Parents can view their children
CREATE POLICY "Parents can view their children"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_relationships
      WHERE parent_id = auth.uid() AND student_id = users.id
    )
  );
