-- =====================================================
-- COMPLETE FIX: RLS Policies for Class Assignments
-- =====================================================
-- Run this ENTIRE script in Supabase Dashboard > SQL Editor

-- Step 1: Ensure helper function exists
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.users WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop all existing policies on class_assignments
DROP POLICY IF EXISTS "Users can view own class assignments" ON public.class_assignments;
DROP POLICY IF EXISTS "Teachers can view assignments in their classes" ON public.class_assignments;
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.class_assignments;
DROP POLICY IF EXISTS "Admins can insert class assignments" ON public.class_assignments;
DROP POLICY IF EXISTS "Admins can update class assignments" ON public.class_assignments;
DROP POLICY IF EXISTS "Admins can delete class assignments" ON public.class_assignments;

-- Step 3: Create SELECT policies
CREATE POLICY "Users can view own class assignments"
  ON public.class_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view assignments in their classes"
  ON public.class_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_assignments AS teacher_assignment
      WHERE teacher_assignment.class_id = class_assignments.class_id
        AND teacher_assignment.user_id = auth.uid()
        AND teacher_assignment.assignment_type = 'teacher'
        AND teacher_assignment.is_active = true
    )
  );

CREATE POLICY "Admins can view all assignments"
  ON public.class_assignments FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid())
    IN ('super_admin', 'diocese_admin', 'church_admin')
  );

-- Step 4: Create INSERT policy (THIS IS THE KEY ONE FOR YOUR ERROR)
CREATE POLICY "Admins can insert class assignments"
  ON public.class_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid())
    IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
  );

-- Step 5: Create UPDATE policy
CREATE POLICY "Admins can update class assignments"
  ON public.class_assignments FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid())
    IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
  )
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid())
    IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
  );

-- Step 6: Create DELETE policy
CREATE POLICY "Admins can delete class assignments"
  ON public.class_assignments FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid())
    IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
  );

-- Step 7: Verify the policies were created
SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'class_assignments'
ORDER BY policyname;

-- You should see 6 policies listed
