-- =====================================================
-- ADD RLS POLICIES FOR CLASS ASSIGNMENTS
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own class assignments" ON public.class_assignments;
DROP POLICY IF EXISTS "Teachers can view assignments in their classes" ON public.class_assignments;
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.class_assignments;
DROP POLICY IF EXISTS "Admins can insert class assignments" ON public.class_assignments;
DROP POLICY IF EXISTS "Admins can update class assignments" ON public.class_assignments;
DROP POLICY IF EXISTS "Admins can delete class assignments" ON public.class_assignments;

-- Policy: Users can view their own class assignments
CREATE POLICY "Users can view own class assignments"
  ON public.class_assignments FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
  );

-- Policy: Teachers can view assignments in classes they teach
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

-- Policy: Admins can view all class assignments
CREATE POLICY "Admins can view all assignments"
  ON public.class_assignments FOR SELECT
  TO authenticated
  USING (
    get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin')
  );

-- Policy: Admins can insert class assignments
CREATE POLICY "Admins can insert class assignments"
  ON public.class_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
  );

-- Policy: Admins can update class assignments
CREATE POLICY "Admins can update class assignments"
  ON public.class_assignments FOR UPDATE
  TO authenticated
  USING (
    get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
  )
  WITH CHECK (
    get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
  );

-- Policy: Admins can delete class assignments
CREATE POLICY "Admins can delete class assignments"
  ON public.class_assignments FOR DELETE
  TO authenticated
  USING (
    get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
  );

-- Add comments
COMMENT ON POLICY "Users can view own class assignments" ON public.class_assignments IS
  'Allows users to view their own class assignments';
COMMENT ON POLICY "Teachers can view assignments in their classes" ON public.class_assignments IS
  'Allows teachers to view all assignments in classes they teach';
COMMENT ON POLICY "Admins can view all assignments" ON public.class_assignments IS
  'Allows admins to view all class assignments in their scope';
COMMENT ON POLICY "Admins can insert class assignments" ON public.class_assignments IS
  'Allows admins and teachers to create class assignments';
COMMENT ON POLICY "Admins can update class assignments" ON public.class_assignments IS
  'Allows admins and teachers to update class assignments';
COMMENT ON POLICY "Admins can delete class assignments" ON public.class_assignments IS
  'Allows admins and teachers to delete class assignments';
